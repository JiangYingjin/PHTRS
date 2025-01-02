'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Tooltip,
  CardFooter
} from '@nextui-org/react';
import {
  MapPinIcon,
  ChartBarIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { WorkOrderModal } from './components/WorkOrderModal';
import { WorkOrdersPage } from './components/WorkOrdersPage';
import { DamageReportsPage } from './components/DamageReportsPage';

export default function PHTRS() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('report');
  const [loading, setLoading] = useState(false);
  const [potholes, setPotholes] = useState([]);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    streetAddress: '',
    size: '1',
    location: 'middle',
    district: '',
    damage: {
      citizenName: '',
      address: '',
      phoneNumber: '',
      typeOfDamage: '',
      damageAmount: '0'
    }
  });

  // 获取坑洞列表
  const fetchPotholes = async () => {
    try {
      const response = await fetch('/api/PHTRS');
      const data = await response.json();
      if (data.success) {
        setPotholes(data.data);
      }
    } catch (error) {
      console.error('Error fetching potholes:', error);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/PHTRS', {
        method: 'OPTIONS'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchPotholes();
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requestData = {
        ...formData,
        size: parseInt(formData.size),
        damage: formData.damage.citizenName ? {
          ...formData.damage,
          damageAmount: parseFloat(formData.damage.damageAmount)
        } : null
      };

      const response = await fetch('/api/PHTRS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        fetchPotholes();
        setFormData({
          streetAddress: '',
          size: '1',
          location: 'middle',
          district: '',
          damage: {
            citizenName: '',
            address: '',
            phoneNumber: '',
            typeOfDamage: '',
            damageAmount: '0'
          }
        });
      }
    } catch (error) {
      console.error('Error submitting pothole:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Pothole Tracking System
              </h1>
            </div>
            <div className="flex items-center">
              <Button
                color="primary"
                endContent={<MapPinIcon className="h-5 w-5" />}
                onPress={onOpen}
              >
                Report New Pothole
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          aria-label="Options"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key.toString())}
          color="primary"
          className="mb-6"
        >
          <Tab
            key="dashboard"
            title={
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Potholes"
                value={stats?.overall?.total_potholes || 0}
                icon={<MapPinIcon className="h-6 w-6 text-blue-500" />}
              />
              <StatCard
                title="In Progress"
                value={stats?.overall?.in_progress_count || 0}
                icon={<WrenchIcon className="h-6 w-6 text-yellow-500" />}
              />
              <StatCard
                title="Completed"
                value={stats?.overall?.repaired_count || 0}
                icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
              />
              <StatCard
                title="Total Damage Cost"
                value={`$${typeof stats?.overall?.total_damage_amount === 'number'
                  ? stats.overall.total_damage_amount.toFixed(2)
                  : '0.00'}`}
                icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Repairs by District</h3>
                </CardHeader>
                <CardBody>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.byDistrict || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="District"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                        />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="pothole_count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">District Statistics</h3>
                </CardHeader>
                <CardBody>
                  <Table aria-label="District statistics">
                    <TableHeader>
                      <TableColumn>DISTRICT</TableColumn>
                      <TableColumn>POTHOLES</TableColumn>
                      <TableColumn>REPAIRS</TableColumn>
                      <TableColumn>COST</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {stats?.byDistrict?.map((district) => (
                        <TableRow key={district.District}>
                          <TableCell>{district.District}</TableCell>
                          <TableCell>{district.pothole_count}</TableCell>
                          <TableCell>{district.work_orders}</TableCell>
                          <TableCell>
                            ${typeof district.total_repair_cost === 'number'
                              ? district.total_repair_cost.toFixed(2)
                              : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="potholes"
            title={
              <div className="flex items-center space-x-2">
                <MapPinIcon className="h-5 w-5" />
                <span>Potholes</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {potholes.map((pothole) => (
                <PotholeCard
                  key={pothole.PotholeID}
                  pothole={pothole}
                  onStatusUpdate={fetchPotholes}
                />
              ))}
            </div>
          </Tab>

          <Tab
            key="workorders"
            title={
              <div className="flex items-center space-x-2">
                <WrenchIcon className="h-5 w-5" />
                <span>Work Orders</span>
              </div>
            }
          >
            <WorkOrdersPage />
          </Tab>

          <Tab
            key="damages"
            title={
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Damage Reports</span>
              </div>
            }
          >
            <DamageReportsPage />
          </Tab>
        </Tabs>
      </main>

      {/* 报告坑洞模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Report New Pothole</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Street Address"
                  placeholder="Enter street address"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({
                    ...formData,
                    streetAddress: e.target.value
                  })}
                  required
                />
                <Select
                  label="District"
                  placeholder="Select district"
                  value={formData.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    district: e.target.value
                  })}
                  required
                >
                  <SelectItem key="north">North District</SelectItem>
                  <SelectItem key="south">South District</SelectItem>
                  <SelectItem key="east">East District</SelectItem>
                  <SelectItem key="west">West District</SelectItem>
                  <SelectItem key="central">Central District</SelectItem>
                </Select>
                <Input
                  type="number"
                  label="Size (1-10)"
                  min={1}
                  max={10}
                  value={formData.size}
                  onChange={(e) => setFormData({
                    ...formData,
                    size: e.target.value
                  })}
                  required
                />
                <Select
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: e.target.value
                  })}
                  required
                >
                  <SelectItem key="middle">Middle of Road</SelectItem>
                  <SelectItem key="curb">Near Curb</SelectItem>
                  <SelectItem key="other">Other</SelectItem>
                </Select>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Damage Report (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Citizen Name"
                    value={formData.damage.citizenName}
                    onChange={(e) => setFormData({
                      ...formData,
                      damage: {
                        ...formData.damage,
                        citizenName: e.target.value
                      }
                    })}
                  />
                  <Input
                    label="Phone Number"
                    value={formData.damage.phoneNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      damage: {
                        ...formData.damage,
                        phoneNumber: e.target.value
                      }
                    })}
                  />
                  <Input
                    label="Type of Damage"
                    value={formData.damage.typeOfDamage}
                    onChange={(e) => setFormData({
                      ...formData,
                      damage: {
                        ...formData.damage,
                        typeOfDamage: e.target.value
                      }
                    })}
                  />
                  <Input
                    type="number"
                    label="Damage Amount ($)"
                    value={formData.damage.damageAmount}
                    onChange={(e) => setFormData({
                      ...formData,
                      damage: {
                        ...formData.damage,
                        damageAmount: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={loading}>
                Submit Report
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}

// 统计卡片组件
function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// 坑洞卡片组件
function PotholeCard({ pothole, onStatusUpdate }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取维修队伍列表
    const fetchCrews = async () => {
      try {
        const response = await fetch('/api/PHTRS/crews');
        const data = await response.json();
        if (data.success) {
          setCrews(data.data);
        }
      } catch (error) {
        console.error('Error fetching crews:', error);
      }
    };
    fetchCrews();
  }, []);

  const handleWorkOrder = async (workOrderData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/PHTRS', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workOrderData)
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error creating work order:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Repaired': return 'success';
      case 'In Progress': return 'warning';
      default: return 'danger';
    }
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">ID: {pothole.PotholeID}</h3>
              <p className="text-sm text-gray-500">{pothole.StreetAddress}</p>
            </div>
            <Chip
              color={getStatusColor(pothole.HoleStatus)}
              variant="flat"
            >
              {pothole.HoleStatus || 'Reported'}
            </Chip>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Size</span>
              <Progress
                value={pothole.Size * 10}
                color="primary"
                className="w-2/3"
                size="sm"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Priority</span>
              <Progress
                value={pothole.RepairPriority * 10}
                color="warning"
                className="w-2/3"
                size="sm"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">District</span>
              <Chip size="sm" variant="flat">{pothole.District}</Chip>
            </div>
            {pothole.DamageReports > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Damage Reports</span>
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                >
                  {pothole.DamageReports}
                </Chip>
              </div>
            )}
          </div>
        </CardBody>
        <CardFooter>
          <Button
            color="primary"
            variant="flat"
            onPress={onOpen}
            isDisabled={pothole.HoleStatus === 'Repaired'}
          >
            {pothole.HoleStatus ? 'Update Work Order' : 'Create Work Order'}
          </Button>
        </CardFooter>
      </Card>

      <WorkOrderModal
        isOpen={isOpen}
        onClose={onClose}
        pothole={pothole}
        crews={crews}
        onSubmit={handleWorkOrder}
      />
    </>
  );
}
