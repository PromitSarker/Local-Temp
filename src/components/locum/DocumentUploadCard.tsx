import { useState, useRef } from "react";
import {
  Upload,
  Check,
  Clock,
  AlertCircle,
  FileText,
  X,
  Calendar,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DocumentItem, DocumentStatus } from "@/hooks/useLocumProfile";

interface DocumentUploadCardProps {
  document: DocumentItem;
  onUpload: (
    documentId: string,
    fileName: string,
    textValue?: string,
    expiryDate?: Date,
    file?: File,
  ) => void;
}

const statusConfig: Record<
  DocumentStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    iconBgClass: string;
  }
> = {
  not_uploaded: {
    label: "Requires Upload",
    icon: AlertCircle,
    badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    iconBgClass: "bg-slate-200 text-slate-600",
  },
  uploaded: {
    label: "Approved",
    icon: Check,
    badgeClass:
      "bg-emerald-50 text-emerald-700 bg-opacity-100 hover:bg-emerald-100",
    iconBgClass: "bg-emerald-600 text-white",
  },
  pending_review: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    iconBgClass: "bg-amber-500 text-white",
  },
  approved: {
    label: "Approved",
    icon: Check,
    badgeClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    iconBgClass: "bg-emerald-600 text-white",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    badgeClass: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    iconBgClass: "bg-destructive text-destructive-foreground",
  },
};

export function DocumentUploadCard({
  document,
  onUpload,
}: DocumentUploadCardProps) {
  const [textValue, setTextValue] = useState(document.textValue || "");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = statusConfig[document.status];
  const isUploaded = document.status !== "not_uploaded";

  const uploadedDate = document.uploadedAt
    ? document.uploadedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not Uploaded";

  const displayExpiry = document.expiryDate
    ? document.expiryDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No Expiry";

  let daysUntilExpiry = "N/A";
  let isExpiringSoon = false;

  if (document.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDateOnly = new Date(document.expiryDate);
    expiryDateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDateOnly.getTime() - today.getTime();
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (remainingDays < 0) {
      daysUntilExpiry = "Expired";
      isExpiringSoon = true;
    } else {
      daysUntilExpiry = `${remainingDays} days`;
      isExpiringSoon = remainingDays <= 30;
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (document.inputType === "file" && selectedFile) {
      onUpload(
        document.id,
        selectedFile.name,
        undefined,
        expiryDate ? new Date(expiryDate) : undefined,
        selectedFile,
      );
    } else if (document.inputType === "text" && textValue) {
      onUpload(document.id, "N/A", textValue);
    } else if (document.inputType === "both" && selectedFile && textValue) {
      onUpload(
        document.id,
        selectedFile.name,
        textValue,
        expiryDate ? new Date(expiryDate) : undefined,
        selectedFile,
      );
    }
    setSelectedFile(null);
    setTextValue("");
    setIsReplacing(false);
    setExpiryDate("");
  };

  const canUpload = () => {
    if (document.inputType === "file") return !!selectedFile;
    if (document.inputType === "text") return !!textValue.trim();
    if (document.inputType === "both")
      return !!selectedFile && !!textValue.trim();
    return false;
  };

  return (
    <Card
      className={cn(
        "p-4 sm:p-6",
        isExpiringSoon ? "border-amber-200 bg-amber-50/10" : "border-border"
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-1",
            status.iconBgClass,
          )}
        >
          {document.status === "not_uploaded" ? (
            <AlertCircle className="w-6 h-6" />
          ) : document.status === "pending_review" ? (
            isUploaded ? (
              <div className="w-4 h-4 rounded-full bg-white" />
            ) : (
              <Clock className="w-6 h-6" />
            )
          ) : (
            <div className="w-4 h-4 rounded-full bg-white" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-lg text-foreground truncate sm:whitespace-normal break-words">
                {document.name}
              </h4>
              <p className="text-sm text-muted-foreground break-words">
                {document.description}
              </p>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide whitespace-nowrap self-start",
                status.badgeClass,
              )}
            >
              {document.status === "pending_review" && (
                <Clock className="w-3 h-3 inline mr-1 mb-0.5" />
              )}
              {status.label}
            </div>
          </div>

          {!isReplacing && isUploaded ? (
            <>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Uploaded</p>
                  <p className="font-medium truncate">{uploadedDate}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Expiry Date
                  </p>
                  <p className="font-medium truncate">{displayExpiry}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Days Until Expiry
                  </p>
                  <p
                    className={cn(
                      "font-medium truncate",
                      isExpiringSoon ? "text-amber-600" : "",
                    )}
                  >
                    {daysUntilExpiry}
                  </p>
                </div>
                <div className="flex items-center min-w-0">
                  {document.status === "pending_review" ? (
                    <div className="flex items-center text-amber-600 gap-2 font-medium truncate">
                      <Clock className="w-4 h-4 shrink-0" /> Pending
                    </div>
                  ) : (
                    <div className="flex items-center text-emerald-600 gap-2 font-medium truncate">
                      <CheckCircle2 className="w-5 h-5 shrink-0" /> Approved
                    </div>
                  )}
                </div>
              </div>

              {isExpiringSoon && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-3 mt-4">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Notice: This document expires within 30 days.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-2">
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 bg-white hover:bg-slate-50"
                >
                  <Eye className="w-4 h-4 mr-2" /> View Document
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 bg-white hover:bg-slate-50"
                  onClick={() => setIsReplacing(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Replace
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-border">
                {(document.inputType === "text" ||
                  document.inputType === "both") && (
                  <div className="mb-4">
                    <Label className="text-sm mb-1.5 block">
                      {document.textLabel}
                    </Label>
                    <Input
                      type="text"
                      placeholder={document.textPlaceholder}
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                )}

                {(document.inputType === "file" ||
                  document.inputType === "both") && (
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="flex-1 text-sm truncate">
                          {selectedFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-center gap-2 bg-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Select File to Upload
                      </Button>
                    )}
                  </div>
                )}

                {document.hasExpiryField && (
                  <div className="mb-4">
                    <Label className="text-sm flex items-center gap-1 mb-1.5">
                      <Calendar className="w-3 h-3" />
                      Expiry Date
                    </Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {isReplacing && (
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 bg-white"
                      onClick={() => setIsReplacing(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    className={cn(
                      "shadow-primary w-full",
                      isReplacing ? "sm:flex-1" : "",
                    )}
                    disabled={!canUpload()}
                    onClick={handleUpload}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isReplacing ? "Update Document" : "Upload Document"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
