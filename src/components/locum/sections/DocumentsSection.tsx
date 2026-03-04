import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Check,
  Clock,
  AlertTriangle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { DocumentUploadCard } from "../DocumentUploadCard";
import type { DocumentItem } from "@/hooks/useLocumProfile";

interface DocumentsSectionProps {
  documents: DocumentItem[];
  completionPercentage: number;
  isProfileComplete: boolean;
  onUpload: (
    documentId: string,
    fileName: string,
    textValue?: string,
    expiryDate?: Date,
    file?: File,
  ) => void;
}

export function DocumentsSection({
  documents,
  completionPercentage,
  isProfileComplete,
  onUpload,
}: DocumentsSectionProps) {
  const uploadedCount = documents.filter(
    (doc) => doc.status !== "not_uploaded",
  ).length;

  const pendingReviewCount = documents.filter(
    (doc) => doc.status === "pending_review",
  ).length;

  // Calculate documents expiring within 30 days
  const expiringCount = documents.filter((doc) => {
    if (!doc.expiryDate || doc.status === "not_uploaded") return false;
    const daysUntilExpiry = Math.ceil(
      (doc.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Document Vault</h2>
        <p className="text-muted-foreground">
          Manage your professional credentials and compliance documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Overall Completion
            </span>
            <span className="text-sm font-bold">{completionPercentage}%</span>
          </div>
          <Progress
            value={completionPercentage}
            className="h-2 mb-2 bg-emerald-100 [&>div]:bg-emerald-600"
          />
          <p className="text-xs text-muted-foreground">
            {uploadedCount} of {documents.length} documents approved
          </p>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingReviewCount}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{expiringCount}</div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
        </Card>
      </div>

      {/* Action Required Banner */}
      {expiringCount > 0 && (
        <Alert
          variant="destructive"
          className="bg-orange-50 border-orange-200 text-orange-800 [&>svg]:text-orange-600"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-orange-800 font-semibold">
            Action Required:
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            {expiringCount} document{expiringCount > 1 ? 's' : ''} expiring within 30 days. Please upload renewed versions to
            maintain your active status.
          </AlertDescription>
        </Alert>
      )}

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <DocumentUploadCard
            key={document.id}
            document={document}
            onUpload={onUpload}
          />
        ))}
      </div>
    </div>
  );
}
