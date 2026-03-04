import { Card } from "@/components/ui/card";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Briefcase,
  X,
  Menu,
  Users,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PracticeSidebar } from "@/components/practice/PracticeSidebar";
import { BookingModal } from "@/components/practice/BookingModal";
import { LocumProfileDialog } from "@/components/practice/LocumProfileDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type SortOption = "highest-rated" | "lowest-rate" | "most-experienced";

interface Locum {
  id: string;
  user_id: string;
  full_name: string;
  job_type: string[] | null;
  city: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  reliability_score: number | null;
  avg_rating: number;
  review_count: number;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const SPECIALTY_OPTIONS = [
  { value: "all", label: "All Specialties" },
  { value: "General Dentist", label: "General Dentistry" },
  { value: "Cosmetic Dentist", label: "Cosmetic Dentistry" },
  { value: "Orthodontist", label: "Orthodontics" },
  { value: "Oral Surgeon", label: "Oral Surgery" },
  { value: "Endodontist", label: "Endodontics" },
  { value: "Periodontist", label: "Periodontics" },
  { value: "Hygienist", label: "Dental Hygienist" },
  { value: "Therapist", label: "Dental Therapist" },
];

export default function FindLocums() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allLocums, setAllLocums] = useState<Locum[]>([]);
  const [selectedLocum, setSelectedLocum] = useState<Locum | null>(null);
  const [viewProfileLocumId, setViewProfileLocumId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocums, setSelectedLocums] = useState<string[]>([]);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("highest-rated");

  // Filters
  const [appliedFilters, setAppliedFilters] = useState({
    maxRate: 200,
    minRating: 0,
    specialty: "all",
  });
  const [pendingFilters, setPendingFilters] = useState({
    maxRate: 200,
    minRating: 0,
    specialty: "all",
  });

  // ── Data fetching ──────────────────────────────────────────────
  const fetchLocums = useCallback(async (city: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          full_name,
          job_type,
          city,
          hourly_rate,
          experience_years,
          reliability_score,
          reviews!reviews_reviewee_id_fkey ( rating )
        `)
        .eq("user_type", "locum");

      if (city.trim()) {
        query = query.ilike("city", `%${city.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Compute avg_rating per locum from joined reviews
      const enriched: Locum[] = (data || []).map((l: any) => {
        const ratings: number[] = (l.reviews || []).map((r: any) => r.rating);
        const avg =
          ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
            : 0;
        return {
          id: l.id,
          user_id: l.user_id,
          full_name: l.full_name,
          job_type: l.job_type,
          city: l.city,
          hourly_rate: l.hourly_rate,
          experience_years: l.experience_years,
          reliability_score: l.reliability_score,
          avg_rating: avg,
          review_count: ratings.length,
        };
      });

      setAllLocums(enriched);
    } catch (err) {
      console.error("Error fetching locums:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch when location changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchLocums(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchLocums]);

  // ── Client-side filter + sort ──────────────────────────────────
  const displayedLocums = useMemo(() => {
    let filtered = allLocums.filter((l) => {
      if ((l.hourly_rate ?? 0) > appliedFilters.maxRate) return false;
      if (l.avg_rating < appliedFilters.minRating) return false;
      if (
        appliedFilters.specialty !== "all" &&
        !(l.job_type ?? []).some((jt) =>
          jt.toLowerCase().includes(appliedFilters.specialty.toLowerCase())
        )
      )
        return false;
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "highest-rated") return b.avg_rating - a.avg_rating;
      if (sortBy === "lowest-rate")
        return (a.hourly_rate ?? 0) - (b.hourly_rate ?? 0);
      if (sortBy === "most-experienced")
        return (b.experience_years ?? 0) - (a.experience_years ?? 0);
      return 0;
    });

    return filtered;
  }, [allLocums, appliedFilters, sortBy]);

  // ── Invite Selected ────────────────────────────────────────────
  const handleInviteSelected = async () => {
    if (selectedLocums.length === 0) return;
    setIsSendingInvites(true);

    try {
      // Fetch current practice's profile to get a name for the notification
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: practice } = await supabase
        .from("profiles")
        .select("full_name, practice_name")
        .eq("user_id", session.user.id)
        .single();

      const practiceLabel =
        practice?.practice_name || practice?.full_name || "A practice";

      // Insert one notification per selected locum
      const notifications = selectedLocums.map((locumId) => {
        const locum = allLocums.find((l) => l.id === locumId);
        return {
          user_id: locum?.user_id ?? locumId,
          title: "You've been invited to work!",
          message: `${practiceLabel} has expressed interest in booking you. Log in to your dashboard and check your messages.`,
          type: "booking_request",
        };
      });

      const { error } = await supabase.from("notifications").insert(notifications as any);
      if (error) throw error;

      const names = allLocums
        .filter((l) => selectedLocums.includes(l.id))
        .map((l) => l.full_name)
        .join(", ");

      toast({
        title: `Invitations sent to ${selectedLocums.length} locum${selectedLocums.length > 1 ? "s" : ""} ✓`,
        description: names,
      });

      setSelectedLocums([]);
    } catch (err: any) {
      toast({
        title: "Failed to send invitations",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvites(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const defaults = { maxRate: 200, minRating: 0, specialty: "all" };
    setPendingFilters(defaults);
    setAppliedFilters(defaults);
  };

  const activeFilterCount = [
    appliedFilters.maxRate < 200,
    appliedFilters.minRating > 0,
    appliedFilters.specialty !== "all",
  ].filter(Boolean).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <PracticeSidebar onLogout={handleLogout} />

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PracticeSidebar onLogout={handleLogout} isMobileSheet={true} />
        </SheetContent>
      </Sheet>

      <main className="md:ml-64 min-h-screen">
        {/* Header */}
        <div className="px-4 md:px-8 py-4 md:py-6 flex items-center gap-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Find a Locum
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Search and book qualified dental professionals
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 space-y-5">
          {/* Search + Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by city (e.g. London)..."
                className="pl-10 h-12 bg-background border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className={`h-12 gap-2 w-full sm:w-auto relative ${
                showFilters ? "bg-primary text-primary-foreground" : ""
              }`}
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-5 border-border bg-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base">Filter Results</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                {/* Specialty */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Specialty
                  </label>
                  <Select
                    value={pendingFilters.specialty}
                    onValueChange={(v) =>
                      setPendingFilters({ ...pendingFilters, specialty: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex justify-between">
                    Max Hourly Rate
                    <span className="font-semibold text-foreground">
                      £{pendingFilters.maxRate}/hr
                    </span>
                  </label>
                  <Slider
                    value={[pendingFilters.maxRate]}
                    min={20}
                    max={200}
                    step={5}
                    onValueChange={(v) =>
                      setPendingFilters({ ...pendingFilters, maxRate: v[0] })
                    }
                    className="py-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>£20</span>
                    <span>£200</span>
                  </div>
                </div>

                {/* Min Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex justify-between">
                    Minimum Rating
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {pendingFilters.minRating.toFixed(1)}+
                    </span>
                  </label>
                  <Slider
                    value={[pendingFilters.minRating]}
                    min={0}
                    max={5}
                    step={0.5}
                    onValueChange={(v) =>
                      setPendingFilters({ ...pendingFilters, minRating: v[0] })
                    }
                    className="py-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Any</span>
                    <span>5.0 ★</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button onClick={handleApplyFilters} className="flex-1 sm:flex-initial">
                  Apply Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 opacity-80">({activeFilterCount} active)</span>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Results bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground text-sm">
                {isLoading
                  ? "Searching..."
                  : `${displayedLocums.length} locum${displayedLocums.length !== 1 ? "s" : ""} found`}
              </p>
              {displayedLocums.length > 0 && (
                <div className="flex items-center gap-2 border-l pl-4">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedLocums.length > 0 &&
                      selectedLocums.length === displayedLocums.length
                    }
                    onCheckedChange={(checked) => {
                      setSelectedLocums(
                        checked ? displayedLocums.map((l) => l.id) : []
                      );
                    }}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedLocums.length > 0 && (
                <Button
                  variant="default"
                  className="bg-emerald-700 hover:bg-emerald-800 gap-2"
                  onClick={handleInviteSelected}
                  disabled={isSendingInvites}
                >
                  <Users className="w-4 h-4" />
                  {isSendingInvites
                    ? "Sending..."
                    : `Invite Selected (${selectedLocums.length})`}
                </Button>
              )}
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                  <SelectItem value="lowest-rate">Lowest Rate</SelectItem>
                  <SelectItem value="most-experienced">Most Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Locums Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : displayedLocums.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <h3 className="font-semibold text-lg text-foreground mb-1">
                No locums found
              </h3>
              <p className="text-sm max-w-sm mx-auto">
                Try adjusting your search or filters to see more results.
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {displayedLocums.map((locum) => (
                <Card
                  key={locum.id}
                  className={`p-6 border transition-all ${
                    selectedLocums.includes(locum.id)
                      ? "border-emerald-600 bg-emerald-50/30 shadow-md"
                      : "border-border hover:shadow-sm"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <Checkbox
                      className="mt-1 border-slate-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      checked={selectedLocums.includes(locum.id)}
                      onCheckedChange={(checked) => {
                        setSelectedLocums((prev) =>
                          checked
                            ? [...prev, locum.id]
                            : prev.filter((id) => id !== locum.id)
                        );
                      }}
                    />
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-lg flex-shrink-0 border border-emerald-100">
                      {getInitials(locum.full_name || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {locum.full_name}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {locum.job_type?.[0] || "Dental Professional"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-700 text-[10px]">
                            {locum.avg_rating > 0
                              ? locum.avg_rating.toFixed(1)
                              : "New"}
                          </span>
                          {locum.review_count > 0 && (
                            <span className="text-[9px] text-slate-400">
                              ({locum.review_count})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            Reliability:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            {locum.reliability_score ?? 100}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{locum.city || "Location not set"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {(locum.experience_years ?? 0) > 0
                          ? `${locum.experience_years}+ yrs experience`
                          : "Experience not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-medium">
                          Hourly Rate
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          £{locum.hourly_rate ?? "—"}
                          <span className="text-sm font-normal text-slate-400">
                            /hr
                          </span>
                        </p>
                      </div>
                      <div className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded border border-slate-100 uppercase">
                        GDC Verified
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => setViewProfileLocumId(locum.id)}
                      >
                        View Profile
                      </Button>
                      <Button
                        className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => setSelectedLocum(locum)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <LocumProfileDialog
        isOpen={!!viewProfileLocumId}
        onClose={() => setViewProfileLocumId(null)}
        locumId={viewProfileLocumId}
      />

      <BookingModal
        isOpen={!!selectedLocum}
        onClose={() => setSelectedLocum(null)}
        locumId={selectedLocum?.id}
        locumName={selectedLocum?.full_name || ""}
        hourlyRate={selectedLocum?.hourly_rate || 0}
      />
    </div>
  );
}
