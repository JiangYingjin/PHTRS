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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure
} from '@nextui-org/react';

export function DamageReportsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    citizenName: '',
    address: '',
    phoneNumber: '',
    typeOfDamage: '',
    damageAmount: '',
    potholeId: ''
  });

  useEffect(() => {
    fetchDamageReports();
  }, []);

  const fetchDamageReports = async () => {
    try {
      const response = await fetch('/api/statistics?type=damages');
      const data = await response.json();
      if (data.success) {
        setDamageReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching damage reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          damage: {
            ...formData,
            damageAmount: parseFloat(formData.damageAmount)
          }
        })
      });

      if (response.ok) {
        onClose();
        fetchDamageReports();
        setFormData({
          citizenName: '',
          address: '',
          phoneNumber: '',
          typeOfDamage: '',
          damageAmount: '',
          potholeId: ''
        });
      }
    } catch (error) {
      console.error('Error submitting damage report:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-bold">Damage Reports</h2>
          <Button color="primary" onPress={onOpen}>
            New Damage Report
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label="Damage reports table">
            <TableHeader>
              <TableColumn>CITIZEN</TableColumn>
              <TableColumn>CONTACT</TableColumn>
              <TableColumn>DAMAGE</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {damageReports.map((report: any) => (
                <TableRow key={report.DamageID}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{report.CitizenName}</p>
                      <p className="text-sm text-gray-500">{report.Address}</p>
                    </div>
                  </TableCell>
                  <TableCell>{report.PhoneNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p>{report.TypeOfDamage}</p>
                      <p className="font-semibold">
                        ${typeof report.DamageAmount === 'number'
                          ? report.DamageAmount.toFixed(2)
                          : parseFloat(report.DamageAmount || '0').toFixed(2)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{report.StreetAddress}</p>
                      <p className="text-sm text-gray-500">{report.District}</p>
                    </div>
                  </TableCell>
                  <TableCell>{report.HoleStatus || 'Pending'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>New Damage Report</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Citizen Name"
                  value={formData.citizenName}
                  onChange={(e) => setFormData({
                    ...formData,
                    citizenName: e.target.value
                  })}
                  required
                />
                <Input
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    phoneNumber: e.target.value
                  })}
                  required
                />
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: e.target.value
                  })}
                  required
                />
                <Input
                  type="number"
                  label="Damage Amount ($)"
                  value={formData.damageAmount}
                  onChange={(e) => setFormData({
                    ...formData,
                    damageAmount: e.target.value
                  })}
                  required
                />
                <Textarea
                  label="Type of Damage"
                  value={formData.typeOfDamage}
                  onChange={(e) => setFormData({
                    ...formData,
                    typeOfDamage: e.target.value
                  })}
                  className="col-span-2"
                  required
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Submit Report
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
} 