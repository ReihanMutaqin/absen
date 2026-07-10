import { useState } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  FileText,
} from "lucide-react";

const leaveTypeLabels: Record<string, string> = {
  sakit: "Sakit",
  cuti: "Cuti",
  izin: "Izin",
  dinas: "Dinas Luar",
};

export default function AdminEmployees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Employees
  const {
    data: employees,
    isLoading: empLoading,
    refetch: refetchEmployees,
  } = trpc.employee.list.useQuery();
  const approveMutation = trpc.employee.approve.useMutation({
    onSuccess: () => { toast.success("Pegawai disetujui"); refetchEmployees(); },
  });
  const rejectMutation = trpc.employee.reject.useMutation({
    onSuccess: () => { toast.success("Pegawai ditolak"); refetchEmployees(); },
  });

  // Leaves
  const {
    data: leaves,
    isLoading: leavesLoading,
    refetch: refetchLeaves,
  } = trpc.leave.list.useQuery();
  const approveLeave = trpc.leave.approve.useMutation({
    onSuccess: () => { toast.success("Izin disetujui"); refetchLeaves(); },
  });
  const rejectLeave = trpc.leave.reject.useMutation({
    onSuccess: () => { toast.success("Izin ditolak"); refetchLeaves(); },
  });

  // Filter employees
  const filteredEmployees = employees?.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.nik.toLowerCase().includes(q) ||
      e.departmentName?.toLowerCase().includes(q)
    );
  });

  const pendingEmployees = filteredEmployees?.filter((e) => e.status === "pending") || [];
  const approvedEmployees = filteredEmployees?.filter((e) => e.status === "approved") || [];
  const rejectedEmployees = filteredEmployees?.filter((e) => e.status === "rejected") || [];

  // Filter leaves
  const pendingLeaves = leaves?.filter((l) => l.status === "pending") || [];
  const processedLeaves = leaves?.filter((l) => l.status !== "pending") || [];

  const handleApprove = async (id: number) => {
    if (!user?.id) { toast.error("Login terlebih dahulu"); return; }
    await approveMutation.mutateAsync({ id, approvedBy: user.id });
  };
  const handleReject = async (id: number) => {
    await rejectMutation.mutateAsync({ id });
  };
  const handleApproveLeave = async (id: number) => {
    if (!user?.id) { toast.error("Login terlebih dahulu"); return; }
    await approveLeave.mutateAsync({ id, approvedBy: user.id });
  };
  const handleRejectLeave = async (id: number) => {
    await rejectLeave.mutateAsync({ id });
  };

  return (
    <MobileLayout title="Approval" showBack onBack={() => navigate("/dashboard")}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama, NIK, atau departemen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="employees" className="text-xs relative">
            Pegawai
            {pendingEmployees.length > 0 && (
              <span className="ml-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full inline-flex items-center justify-center font-bold">
                {pendingEmployees.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs relative">
            Izin/Cuti
            {pendingLeaves.length > 0 && (
              <span className="ml-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full inline-flex items-center justify-center font-bold">
                {pendingLeaves.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== EMPLOYEES TAB ===== */}
        <TabsContent value="employees">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-yellow-50 p-2 rounded-lg text-center">
              <Clock className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-yellow-700">{pendingEmployees.length}</p>
              <p className="text-[10px] text-yellow-600">Pending</p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg text-center">
              <UserCheck className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">{approvedEmployees.length}</p>
              <p className="text-[10px] text-green-600">Approved</p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-center">
              <UserX className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-700">{rejectedEmployees.length}</p>
              <p className="text-[10px] text-red-600">Rejected</p>
            </div>
          </div>

          {empLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-3">
                <EmployeeList
                  employees={pendingEmployees}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approveMutation.isPending}
                  isRejecting={rejectMutation.isPending}
                />
              </TabsContent>
              <TabsContent value="approved" className="mt-3">
                <EmployeeList employees={approvedEmployees} showOnly />
              </TabsContent>
              <TabsContent value="rejected" className="mt-3">
                <EmployeeList employees={rejectedEmployees} showOnly />
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* ===== LEAVES TAB ===== */}
        <TabsContent value="leaves">
          {/* Pending Leaves */}
          {leavesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.length === 0 && processedLeaves.length === 0 && (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Tidak ada permohonan izin</p>
                </div>
              )}

              {pendingLeaves.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Menunggu Persetujuan ({pendingLeaves.length})
                  </p>
                  <div className="space-y-2">
                    {pendingLeaves.map((leave) => (
                      <Card key={leave.id} className="border-yellow-100">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-sm font-semibold">{leave.employeeName}</p>
                              <p className="text-xs text-slate-500">{leave.employeeNik}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {leaveTypeLabels[leave.type] ?? leave.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-1">
                            📅 {leave.startDate === leave.endDate
                              ? leave.startDate
                              : `${leave.startDate} – ${leave.endDate}`}
                          </p>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mb-3">
                            {leave.reason}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleApproveLeave(leave.id)}
                              disabled={approveLeave.isPending}
                            >
                              {approveLeave.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Setujui
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectLeave(leave.id)}
                              disabled={rejectLeave.isPending}
                            >
                              {rejectLeave.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Tolak
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {processedLeaves.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Sudah Diproses ({processedLeaves.length})
                  </p>
                  <div className="space-y-2">
                    {processedLeaves.map((leave) => (
                      <Card key={leave.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{leave.employeeName}</p>
                              <p className="text-xs text-slate-500">
                                {leaveTypeLabels[leave.type] ?? leave.type} · {leave.startDate}
                                {leave.startDate !== leave.endDate && ` – ${leave.endDate}`}
                              </p>
                            </div>
                            <Badge
                              variant={leave.status === "approved" ? "default" : "destructive"}
                              className="text-[10px]"
                            >
                              {leave.status === "approved" ? "Disetujui" : "Ditolak"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}

// ---- Sub-component EmployeeList ----
function EmployeeList({
  employees,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  showOnly,
}: {
  employees: any[];
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  showOnly?: boolean;
}) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Tidak ada data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {employees.map((emp) => (
        <Card key={emp.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {emp.facePhotoUrl ? (
                  <img
                    src={emp.facePhotoUrl}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold truncate">{emp.name}</h4>
                  <Badge
                    variant={
                      emp.status === "approved"
                        ? "default"
                        : emp.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {emp.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{emp.nik}</p>
                {emp.departmentName && (
                  <p className="text-xs text-slate-400">{emp.departmentName}</p>
                )}
                {emp.position && (
                  <p className="text-xs text-slate-400">{emp.position}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Shift: <span className="capitalize">{emp.shift}</span>
                </p>
              </div>
            </div>

            {!showOnly && onApprove && onReject && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onApprove(emp.id)}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Setujui
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onReject(emp.id)}
                  disabled={isRejecting}
                >
                  {isRejecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Tolak
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
