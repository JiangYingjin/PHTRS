import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextResponse } from 'next/server';
import { pool } from '../../PHTRS/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('POST /api/PHTRS', () => {
    // 模拟数据库连接和查询
    const mockConnection = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // 路径1：缺少必填字段
    test('Path 1: should return 400 when required fields are missing', async () => {
        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const response = await POST(req);
        const data = await response.json();

        console.log(data);

        expect(response.status).toBe(400);
        expect(data).toEqual({
            success: false,
            error: 'Missing required fields'
        });
    });

    // 路径2：尺寸超出范围
    test('Path 2: should return 400 when size is out of range', async () => {
        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                streetAddress: '123 Test St',
                size: 11,
                location: 'middle',
                district: 'North'
            })
        });

        const response = await POST(req);
        const data = await response.json();

        console.log(data);

        expect(response.status).toBe(400);
        expect(data).toEqual({
            success: false,
            error: 'Size must be between 1 and 10'
        });
    });

    // 路径3：成功创建坑洞（无损坏报告）
    test('Path 3: should successfully create pothole without damage report', async () => {
        mockConnection.query
            .mockResolvedValueOnce([{ insertId: 101 }])  // Pothole 插入
            .mockResolvedValueOnce([[{                  // 查询新创建的坑洞
                PotholeID: 101,
                StreetAddress: '123 Test St',
                Size: 5,
                DamageID: null
            }]]);

        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                streetAddress: '124 Test St',
                size: 5,
                location: 'middle',
                district: 'North'
            })
        });

        const response = await POST(req);
        const data = await response.json();
        console.log(data);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.DamageID).toBeNull();
    });

    // 路径4：成功创建坑洞（带损坏报告）
    test('Path 4: should successfully create pothole with damage report', async () => {
        mockConnection.query
            .mockResolvedValueOnce([{ insertId: 1 }])  // Pothole 插入
            .mockResolvedValueOnce([{ insertId: 1 }])  // Damage 插入
            .mockResolvedValueOnce([[{                  // 查询新创建的坑洞
                PotholeID: 1,
                StreetAddress: '123 Test St',
                Size: 3,
                DamageID: 1,
                CitizenName: 'John Doe'
            }]]);

        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                streetAddress: '123 Test St',
                size: 3,
                location: 'middle',
                district: 'North',
                damage: {
                    citizenName: 'John Doe',
                    address: '456 Damage St',
                    phoneNumber: '123-456-7890',
                    typeOfDamage: 'Tire damage',
                    damageAmount: 500
                }
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.CitizenName).toBe('John Doe');
    });

    // 路径5：数据库事务回滚
    test('Path 5: should handle transaction rollback', async () => {
        mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                streetAddress: '123 Test St',
                size: 5,
                location: 'middle',
                district: 'North'
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            success: false,
            error: 'Internal Server Error'
        });
        expect(mockConnection.rollback).toHaveBeenCalled();
    });

    // 路径6：最大优先级计算（带损坏报告）
    test('Path 6: should calculate max priority with damage report', async () => {
        mockConnection.query
            .mockResolvedValueOnce([{ insertId: 1 }])  // Pothole 插入
            .mockResolvedValueOnce([{ insertId: 1 }])  // Damage 插入
            .mockResolvedValueOnce([[{                  // 查询新创建的坑洞
                PotholeID: 1,
                StreetAddress: '123 Test St',
                Size: 9,
                DamageID: 1,
                RepairPriority: 10
            }]]);

        const req = new Request(`${BASE_URL}/api/PHTRS`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                streetAddress: '123 Test St',
                size: 9,
                location: 'middle',
                district: 'North',
                damage: {
                    citizenName: 'John Doe',
                    address: '456 Damage St',
                    phoneNumber: '123-456-7890',
                    typeOfDamage: 'Vehicle damage',
                    damageAmount: 1000
                }
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.RepairPriority).toBe(10);  // 验证最大优先级
    });
});