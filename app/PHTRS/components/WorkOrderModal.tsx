import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea
} from '@nextui-org/react';

export function WorkOrderModal({
  isOpen,
  onClose,
  pothole,
  crews = [],
  onSubmit
}) {
  const [formData, setFormData] = useState({
    crewId: '',
    numberOfPeople: '2',
    equipmentAssigned: '',
    hoursApplied: '0',
    holeStatus: 'In Progress',
    fillerMaterialUsed: '0',
    repairCost: '0'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      potholeId: pothole.PotholeID,
      ...formData,
      numberOfPeople: parseInt(formData.numberOfPeople),
      hoursApplied: parseFloat(formData.hoursApplied),
      fillerMaterialUsed: parseFloat(formData.fillerMaterialUsed),
      repairCost: parseFloat(formData.repairCost)
    });
  };

  const calculateRepairCost = async () => {
    try {
      const response = await fetch('/api/PHTRS/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursApplied: parseFloat(formData.hoursApplied),
          numberOfPeople: parseInt(formData.numberOfPeople),
          fillerMaterialUsed: parseFloat(formData.fillerMaterialUsed)
        })
      });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          repairCost: data.data.totalCost.toString()
        }));
      }
    } catch (error) {
      console.error('Error calculating repair cost:', error);
    }
  };

  useEffect(() => {
    if (formData.hoursApplied !== '0' &&
      formData.numberOfPeople !== '0' &&
      formData.fillerMaterialUsed !== '0') {
      calculateRepairCost();
    }
  }, [formData.hoursApplied, formData.numberOfPeople, formData.fillerMaterialUsed]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            Create Work Order - Pothole #{pothole?.PotholeID}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Repair Crew"
                required
                value={formData.crewId}
                onChange={(e) => setFormData({
                  ...formData,
                  crewId: e.target.value
                })}
              >
                {Array.isArray(crews) && crews.map(crew => (
                  <SelectItem key={crew.CrewID} value={crew.CrewID}>
                    {crew.CrewName}
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="number"
                label="Number of People"
                min={1}
                required
                value={formData.numberOfPeople}
                onChange={(e) => setFormData({
                  ...formData,
                  numberOfPeople: e.target.value
                })}
              />

              <Textarea
                label="Equipment Assigned"
                placeholder="List equipment needed..."
                value={formData.equipmentAssigned}
                onChange={(e) => setFormData({
                  ...formData,
                  equipmentAssigned: e.target.value
                })}
              />

              <Input
                type="number"
                label="Hours Applied"
                step="0.5"
                min={0}
                required
                value={formData.hoursApplied}
                onChange={(e) => setFormData({
                  ...formData,
                  hoursApplied: e.target.value
                })}
              />

              <Input
                type="number"
                label="Filler Material (cubic yards)"
                step="0.1"
                min={0}
                required
                value={formData.fillerMaterialUsed}
                onChange={(e) => setFormData({
                  ...formData,
                  fillerMaterialUsed: e.target.value
                })}
              />

              <Input
                type="number"
                label="Repair Cost ($)"
                step="0.01"
                min={0}
                required
                value={formData.repairCost}
                onChange={(e) => setFormData({
                  ...formData,
                  repairCost: e.target.value
                })}
              />

              <Select
                label="Status"
                required
                value={formData.holeStatus}
                onChange={(e) => setFormData({
                  ...formData,
                  holeStatus: e.target.value
                })}
              >
                <SelectItem key="in_progress">In Progress</SelectItem>
                <SelectItem key="repaired">Repaired</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Create Work Order
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 