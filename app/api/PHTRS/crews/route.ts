import { NextResponse } from 'next/server';
import { pool } from '@/app/PHTRS/config/database';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        // 获取维修队伍列表及其工作统计
        const [crews] = await pool.query<RowDataPacket[]>(`
            SELECT 
                rc.CrewID,
                rc.CrewName,
                COUNT(w.WorkOrderID) as ActiveOrders,
                SUM(CASE WHEN w.HoleStatus = 'In Progress' THEN 1 ELSE 0 END) as InProgressOrders,
                SUM(CASE WHEN w.HoleStatus = 'Repaired' THEN 1 ELSE 0 END) as CompletedOrders,
                AVG(w.RepairCost) as AverageRepairCost
            FROM RepairCrew rc
            LEFT JOIN WorkOrder w ON rc.CrewID = w.CrewID
            GROUP BY rc.CrewID, rc.CrewName
            ORDER BY rc.CrewName
        `);

        return NextResponse.json({
            success: true,
            data: crews
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// 添加新的维修队伍
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { crewName } = body;

        if (!crewName) {
            return NextResponse.json(
                { success: false, error: 'Crew name is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query(`
            INSERT INTO RepairCrew (CrewName)
            VALUES (?)
        `, [crewName]);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 