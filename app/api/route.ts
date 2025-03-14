import { NextResponse } from 'next/server';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 获取所有坑洞信息（包括相关的维修和损坏报告）
export async function GET(request: Request) {
    let connection;
    try {
        connection = await pool.getConnection();
        const { searchParams } = new URL(request.url);
        const potholeId = searchParams.get('id');

        if (potholeId) {
            // 获取单个坑洞的详细信息
            const [pothole] = (await connection.query(`
                SELECT 
                    p.*,
                    w.WorkOrderID,
                    w.CrewID,
                    w.HoleStatus,
                    w.RepairCost,
                    rc.CrewName,
                    COUNT(d.DamageID) as DamageReports,
                    SUM(d.DamageAmount) as TotalDamageAmount
                FROM Pothole p
                LEFT JOIN WorkOrder w ON p.PotholeID = w.PotholeID
                LEFT JOIN RepairCrew rc ON w.CrewID = rc.CrewID
                LEFT JOIN Damage d ON p.PotholeID = d.PotholeID
                WHERE p.PotholeID = ?
                GROUP BY p.PotholeID
            `, [potholeId])) as unknown as [RowDataPacket[]];

            return NextResponse.json({
                success: true,
                data: pothole[0]
            });
        }

        // 获取所有坑洞的列表
        const [rows] = (await connection.query(`
            SELECT 
                p.*,
                (
                    SELECT w2.HoleStatus 
                    FROM WorkOrder w2 
                    WHERE w2.PotholeID = p.PotholeID 
                    ORDER BY w2.WorkOrderID DESC 
                    LIMIT 1
                ) as HoleStatus,
                COUNT(d.DamageID) as DamageReports
            FROM Pothole p
            LEFT JOIN Damage d ON p.PotholeID = d.PotholeID
            GROUP BY p.PotholeID
            ORDER BY p.RepairPriority DESC, p.ReportDate DESC
        `)) as unknown as [RowDataPacket[]];

        return NextResponse.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// 报告新坑洞
export async function POST(request: Request) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const body = await request.json();
        const {
            streetAddress,
            size,
            location,
            district,
            damage = null // 可选的损坏报告
        } = body;

        // 输入验证
        if (!streetAddress || !size || !location || !district) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 验证 size 范围
        if (size < 1 || size > 10) {
            return NextResponse.json(
                { success: false, error: 'Size must be between 1 and 10' },
                { status: 400 }
            );
        }

        // 计算修复优先级 (基于尺寸和是否有损坏报告)
        const repairPriority = damage ? Math.min(size + 2, 10) : size;
        console.log('damage', damage);
        console.log('size', size);
        console.log('repairPriority', repairPriority);

        // 插入坑洞记录
        const [result] = (await connection.query(`
            INSERT INTO Pothole (
                StreetAddress,
                Size,
                Location,
                District,
                RepairPriority,
                ReportDate
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [streetAddress, size, location, district, repairPriority])) as unknown as [ResultSetHeader];

        const potholeId = result.insertId;

        console.log('potholeId', potholeId);

        // 如果有损坏报告，添加损坏记录
        if (damage) {
            const {
                citizenName,
                address,
                phoneNumber,
                typeOfDamage,
                damageAmount
            } = damage;

            console.log('damage', damage);

            await connection.query(`
                INSERT INTO Damage (
                    PotholeID,
                    CitizenName,
                    Address,
                    PhoneNumber,
                    TypeOfDamage,
                    DamageAmount
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [potholeId, citizenName, address, phoneNumber, typeOfDamage, damageAmount]);
        }

        await connection.commit();

        // 获取新创建的坑洞完整信息
        const [newPothole] = (await connection.query(`
            SELECT 
                p.*,
                d.DamageID,
                d.CitizenName,
                d.TypeOfDamage,
                d.DamageAmount
            FROM Pothole p
            LEFT JOIN Damage d ON p.PotholeID = d.PotholeID
            WHERE p.PotholeID = ?
        `, [potholeId])) as unknown as [RowDataPacket[]];

        console.log('newPothole', newPothole);

        return NextResponse.json({
            success: true,
            data: newPothole[0]
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// 更新工单状态
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const {
            potholeId,
            crewId,
            numberOfPeople,
            equipmentAssigned,
            hoursApplied,
            holeStatus,
            fillerMaterialUsed,
            repairCost
        } = body;

        if (!potholeId || !crewId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 检查是否已存在工单
        const [existingOrders] = await pool.query<RowDataPacket[]>(
            'SELECT WorkOrderID FROM WorkOrder WHERE PotholeID = ?',
            [potholeId]
        );

        if (existingOrders.length > 0) {
            // 更新现有工单
            await pool.query(`
                UPDATE WorkOrder 
                SET 
                    CrewID = ?,
                    NumberOfPeople = ?,
                    EquipmentAssigned = ?,
                    HoursApplied = ?,
                    HoleStatus = ?,
                    FillerMaterialUsed = ?,
                    RepairCost = ?
                WHERE PotholeID = ?
            `, [crewId, numberOfPeople, equipmentAssigned, hoursApplied,
                holeStatus, fillerMaterialUsed, repairCost, potholeId]);
        } else {
            // 创建新工单
            await pool.query(`
                INSERT INTO WorkOrder (
                    PotholeID,
                    CrewID,
                    NumberOfPeople,
                    EquipmentAssigned,
                    HoursApplied,
                    HoleStatus,
                    FillerMaterialUsed,
                    RepairCost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [potholeId, crewId, numberOfPeople, equipmentAssigned,
                hoursApplied, holeStatus, fillerMaterialUsed, repairCost]);
        }

        // 获取更新后的工单信息
        const [updatedOrder] = await pool.query<RowDataPacket[]>(`
            SELECT 
                w.*,
                rc.CrewName,
                p.StreetAddress,
                p.District
            FROM WorkOrder w
            JOIN RepairCrew rc ON w.CrewID = rc.CrewID
            JOIN Pothole p ON w.PotholeID = p.PotholeID
            WHERE w.PotholeID = ?
        `, [potholeId]);

        return NextResponse.json({
            success: true,
            data: updatedOrder[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// 获取统计信息
export async function OPTIONS() {
    try {
        // 整体统计
        const [overallStats] = await pool.query<RowDataPacket[]>(`
            SELECT 
                COUNT(*) as total_potholes,
                AVG(Size) as average_size,
                AVG(RepairPriority) as average_priority,
                COUNT(DISTINCT District) as total_districts,
                (SELECT COUNT(*) FROM WorkOrder WHERE HoleStatus = 'Repaired') as repaired_count,
                (SELECT COUNT(*) FROM WorkOrder WHERE HoleStatus = 'In Progress') as in_progress_count,
                (SELECT SUM(RepairCost) FROM WorkOrder) as total_repair_cost,
                (SELECT SUM(DamageAmount) FROM Damage) as total_damage_amount
            FROM Pothole
        `);

        // 按区域统计
        const [districtStats] = await pool.query<RowDataPacket[]>(`
            SELECT 
                p.District,
                COUNT(*) as pothole_count,
                AVG(p.Size) as average_size,
                COUNT(w.WorkOrderID) as work_orders,
                COUNT(d.DamageID) as damage_reports,
                SUM(w.RepairCost) as total_repair_cost,
                SUM(d.DamageAmount) as total_damage_amount
            FROM Pothole p
            LEFT JOIN WorkOrder w ON p.PotholeID = w.PotholeID
            LEFT JOIN Damage d ON p.PotholeID = d.PotholeID
            GROUP BY p.District
        `);

        return NextResponse.json({
            success: true,
            data: {
                overall: overallStats[0],
                byDistrict: districtStats
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
