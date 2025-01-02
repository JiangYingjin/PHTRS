'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react';
import { WorkOrderModal } from './WorkOrderModal';

export function WorkOrdersPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedPothole, setSelectedPothole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/PHTRS/statistics?type=workorders');
      const data = await response.json();
      if (data.success) {
        setWorkOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Repaired': return 'success';
      case 'In Progress': return 'warning';
      case 'Temporary Fix': return 'primary';
      default: return 'danger';
    }
  };

  const handleCreateWorkOrder = (pothole) => {
    setSelectedPothole(pothole);
    onOpen();
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-bold">Work Orders Management</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Work orders table">
            <TableHeader>
              <TableColumn>POTHOLE ID</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>CREW</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>COST</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.WorkOrderID}>
                  <TableCell>{order.PotholeID}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{order.StreetAddress}</p>
                      <p className="text-sm text-gray-500">{order.District}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{order.CrewName}</p>
                      <p className="text-sm text-gray-500">
                        {order.NumberOfPeople} people
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(order.HoleStatus)}
                      variant="flat"
                    >
                      {order.HoleStatus}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">
                        ${typeof order.RepairCost === 'number'
                          ? order.RepairCost.toFixed(2)
                          : parseFloat(order.RepairCost || '0').toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {typeof order.HoursApplied === 'number'
                          ? order.HoursApplied.toFixed(1)
                          : parseFloat(order.HoursApplied || '0').toFixed(1)} hours
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="light">Actions</Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Actions">
                        <DropdownItem
                          key="update"
                          onClick={() => handleCreateWorkOrder(order)}
                        >
                          Update Status
                        </DropdownItem>
                        <DropdownItem key="view">
                          View Details
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <WorkOrderModal
        isOpen={isOpen}
        onClose={onClose}
        pothole={selectedPothole}
        onSubmit={fetchWorkOrders}
      />
    </div>
  );
} 