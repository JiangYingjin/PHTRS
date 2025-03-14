import { Pothole } from '../models/Pothole';

export class PotholeController {
    private potholes: Pothole[] = [];

    public reportPothole(
        address: string,
        size: number,
        location: 'middle' | 'curb' | 'other'
    ): Pothole {
        const pothole = new Pothole(address, size, location);
        this.potholes.push(pothole);
        return pothole;
    }

    public getAllPotholes(): Pothole[] {
        return this.potholes;
    }

    public getPotholeById(id: string): Pothole | undefined {
        return this.potholes.find(pothole => pothole.getId() === id);
    }

    public updatePotholeStatus(
        id: string,
        status: 'reported' | 'in_progress' | 'completed'
    ): boolean {
        const pothole = this.getPotholeById(id);
        if (pothole) {
            pothole.setStatus(status);
            return true;
        }
        return false;
    }

    public getPotholesByDistrict(district: string): Pothole[] {
        return this.potholes.filter(
            pothole => pothole.getDistrict() === district
        );
    }
} 