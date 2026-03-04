import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MapPin, Briefcase, Calendar, CheckCircle2, User } from "lucide-react";
import { usePublicLocumProfile } from "@/hooks/usePublicLocumProfile";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface LocumProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locumId: string | null;
}

export function LocumProfileDialog({
  isOpen,
  onClose,
  locumId,
}: LocumProfileDialogProps) {
  const { profile, loading } = usePublicLocumProfile(locumId);

  if (!locumId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-4 bg-emerald-50/50 border-b">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.fullName ? profile.fullName.split(" ").map(n => n[0]).join("") : <User className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-emerald-900">
                {loading ? <Skeleton className="h-8 w-48" /> : profile?.fullName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-emerald-700">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {loading ? <Skeleton className="h-4 w-32" /> : profile?.jobType[0] || "Dental Professional"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">
                    {profile?.reviews && profile.reviews.length > 0 
                      ? (profile.reviews.reduce((acc, r) => acc + r.rating, 0) / profile.reviews.length).toFixed(1) 
                      : "New"}
                  </span>
                  <span className="text-muted-foreground text-xs">({profile?.reviews.length || 0} reviews)</span>
                </div>
                <div className="text-sm text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  Reliability: {profile?.reliabilityScore || 100}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-900">
                £{profile?.hourlyRate || 0}
              </div>
              <div className="text-xs text-emerald-700">per hour</div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-8">
            {/* About Section */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                About Me
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700 leading-relaxed">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : (
                  profile?.bio
                )}
              </div>
            </section>

            {/* Skills Section */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </>
                ) : profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 font-medium">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No specific skills listed yet.</span>
                )}
              </div>
            </section>

            {/* Availability Section */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Weekly Availability
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {profile?.availability.map((item) => (
                  <div key={item.day} className={`p-2 rounded-lg border text-center text-sm font-medium ${item.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {item.day.substring(0, 3)}
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600" />
                Recent Reviews
              </h3>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : profile?.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-4">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900">{review.reviewerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), "dd MMMM yyyy")}
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 italic">
                        "{review.comment || 'No comment provided.'}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                  No reviews yet
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
