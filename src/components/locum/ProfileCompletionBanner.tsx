import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  isComplete: boolean;
}

export function ProfileCompletionBanner({
  completionPercentage,
  isComplete,
}: ProfileCompletionBannerProps) {
  if (isComplete) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-full">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">
            Complete your profile to start applying for shifts
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Upload all required documents to unlock shift applications. Your profile is{" "}
            {completionPercentage}% complete.
          </p>
          <div className="flex items-center gap-4">
            <Progress value={completionPercentage} className="flex-1 h-2" />
            <span className="text-sm font-medium text-amber-900">
              {completionPercentage}%
            </span>
          </div>
          <Button asChild className="mt-4 shadow-primary">
            <Link to="/locum-dashboard/documents">Complete Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
