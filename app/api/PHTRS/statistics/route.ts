import { NextResponse } from 'next/server';
import { pool } from '@/app/PHTRS/config/database';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'workorders') {
            // 获取工单统计信息
            const [workOrderStats] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    w.*,
                    rc.CrewName,
                    p.StreetAddress,
                    p.Size,
                    p.Location,
                    p.District,
                    SUM(w.HoursApplied * w.NumberOfPeople * 50) as LaborCost,
                    SUM(w.FillerMaterialUsed * 100) as MaterialCost,
                    COUNT(d.DamageID) as DamageReports,
                    SUM(d.DamageAmount) as TotalDamageAmount
                FROM WorkOrder w
                JOIN RepairCrew rc ON w.CrewID = rc.CrewID
                JOIN Pothole p ON w.PotholeID = p.PotholeID
                LEFT JOIN Damage d ON p.PotholeID = d.PotholeID
                GROUP BY w.WorkOrderID
                ORDER BY w.WorkOrderID DESC
            `);

            return NextResponse.json({
                success: true,
                data: workOrderStats
            });
        } else if (type === 'damages') {
            // 获取损害报告统计信息
            const [damageStats] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    d.*,
                    p.StreetAddress,
                    p.Size,
                    p.Location,
                    p.District,
                    w.HoleStatus
                FROM Damage d
                JOIN Pothole p ON d.PotholeID = p.PotholeID
                LEFT JOIN WorkOrder w ON p.PotholeID = w.PotholeID
                ORDER BY d.DamageAmount DESC
            `);

            return NextResponse.json({
                success: true,
                data: damageStats
            });
        } else if (type === 'crews') {
            // 获取维修队伍工作统计
            const [crewStats] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    rc.CrewID,
                    rc.CrewName,
                    COUNT(w.WorkOrderID) as TotalWorkOrders,
                    SUM(w.HoursApplied) as TotalHours,
                    AVG(w.NumberOfPeople) as AvgCrewSize,
                    SUM(w.FillerMaterialUsed) as TotalMaterialUsed,
                    SUM(w.RepairCost) as TotalRepairCost,
                    COUNT(CASE WHEN w.HoleStatus = 'Repaired' THEN 1 END) as CompletedRepairs
                FROM RepairCrew rc
                LEFT JOIN WorkOrder w ON rc.CrewID = w.CrewID
                GROUP BY rc.CrewID
                ORDER BY TotalWorkOrders DESC
            `);

            return NextResponse.json({
                success: true,
                data: crewStats
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid statistics type' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// 添加工单成本计算的辅助函数
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hoursApplied, numberOfPeople, fillerMaterialUsed } = body;

        // 计算成本
        const laborRate = 50; // 每人每小时50美元
        const materialRate = 100; // 每立方码100美元

        const laborCost = hoursApplied * numberOfPeople * laborRate;
        const materialCost = fillerMaterialUsed * materialRate;
        const totalCost = laborCost + materialCost;

        return NextResponse.json({
            success: true,
            data: {
                laborCost,
                materialCost,
                totalCost
            }
        });
    } catch (error) {
        console.error('Calculation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 