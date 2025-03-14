export class Pothole {
    private id: string;
    private address: string;
    private size: number;
    private location: 'middle' | 'curb' | 'other';
    private district: string;
    private priority: number;
    private reportDate: Date;
    private status: 'reported' | 'in_progress' | 'completed';

    constructor(
        address: string,
        size: number,
        location: 'middle' | 'curb' | 'other'
    ) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.address = address;
        this.size = this.validateSize(size);
        this.location = location;
        this.district = this.determineDistrict(address);
        this.priority = this.calculatePriority(size);
        this.reportDate = new Date();
        this.status = 'reported';
    }

    private validateSize(size: number): number {
        if (size < 1) return 1;
        if (size > 10) return 10;
        return size;
    }

    private determineDistrict(address: string): string {
        // 简单示例 - 实际应用中需要更复杂的地址解析逻辑
        return address.split(' ')[0];
    }

    private calculatePriority(size: number): number {
        // 简单的优先级计算逻辑 - 可以根据需求调整
        return Math.ceil(size / 2);
    }

    // Getters
    public getId(): string { return this.id; }
    public getAddress(): string { return this.address; }
    public getSize(): number { return this.size; }
    public getLocation(): string { return this.location; }
    public getDistrict(): string { return this.district; }
    public getPriority(): number { return this.priority; }
    public getStatus(): string { return this.status; }
    public getReportDate(): Date { return this.reportDate; }

    // Setters
    public setStatus(status: 'reported' | 'in_progress' | 'completed'): void {
        this.status = status;
    }
} 