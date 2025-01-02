import { NextResponse } from 'next/server';
import { pool } from '@/app/PHTRS/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { potholeId, citizenName, address, phoneNumber, typeOfDamage, damageAmount } = body;

        // 验证必填字段
        if (!potholeId || !citizenName || !address || !phoneNumber || !typeOfDamage || !damageAmount) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 插入损害报告
        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO Damage (
                PotholeID,
                CitizenName,
                Address,
                PhoneNumber,
                TypeOfDamage,
                DamageAmount
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [potholeId, citizenName, address, phoneNumber, typeOfDamage, damageAmount]);

        // 获取新创建的损害报告
        const [newDamage] = await pool.query<RowDataPacket[]>(`
            SELECT 
                d.*,
                p.StreetAddress,
                p.District,
                w.HoleStatus
            FROM Damage d
            JOIN Pothole p ON d.PotholeID = p.PotholeID
            LEFT JOIN WorkOrder w ON p.PotholeID = w.PotholeID
            WHERE d.DamageID = ?
        `, [result.insertId]);

        return NextResponse.json({
            success: true,
            data: newDamage[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const potholeId = searchParams.get('potholeId');

        let query = `
            SELECT 
                d.*,
                p.StreetAddress,
                p.District,
                w.HoleStatus
            FROM Damage d
            JOIN Pothole p ON d.PotholeID = p.PotholeID
            LEFT JOIN WorkOrder w ON p.PotholeID = w.PotholeID
        `;

        if (potholeId) {
            query += ' WHERE d.PotholeID = ?';
            const [damages] = await pool.query<RowDataPacket[]>(query, [potholeId]);
            return NextResponse.json({
                success: true,
                data: damages
            });
        }

        const [damages] = await pool.query<RowDataPacket[]>(query);
        return NextResponse.json({
            success: true,
            data: damages
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 