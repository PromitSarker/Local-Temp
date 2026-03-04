import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Briefcase, Search, ArrowRight, LogIn, Calendar, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LocumProfileDialog } from "@/components/practice/LocumProfileDialog";
import { UK_CITIES } from "@/data/uk-cities";

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

export default function PublicSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [locums, setLocums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("city") || "");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [viewProfileLocumId, setViewProfileLocumId] = useState<string | null>(null);

  const fetchLocums = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('profiles')
        .select(`
          *,
          reviews!reviews_reviewee_id_fkey ( rating )
        `)
        .eq('user_type', 'locum');

      // Filter by city
      if (selectedCity && selectedCity !== "all") {
        query = query.eq('city', selectedCity);
      } else if (searchQuery) {
        query = query.ilike('city', `%${searchQuery}%`);
      }

      // Filter by specialty
      if (selectedSpecialty && selectedSpecialty !== "all") {
        query = query.contains('job_type', [selectedSpecialty]);
      }

      // Filter by name
      if (nameQuery) {
        query = query.ilike('full_name', `%${nameQuery}%`);
      }

      // Filter by date availability (Exclude locums who have a confirmed booking on this date)
      if (availabilityDate) {
        const { data: bookedLocums } = await supabase
          .from('bookings')
          .select('locum_id')
          .eq('date', availabilityDate)
          .in('status', ['confirmed', 'pending']);
        
        if (bookedLocums && bookedLocums.length > 0) {
          const bookedIds = bookedLocums.map(b => b.locum_id);
          query = query.not('id', 'in', `(${bookedIds.join(',')})`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Calculate avg_rating
      const enriched = (data || []).map((l: any) => {
        const ratings = (l.reviews || []).map((r: any) => r.rating);
        const avg = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
          : 0;
        return { ...l, avg_rating: avg, review_count: ratings.length };
      });

      // Apply sorting manually for derived ratings if needed, or by distance (created_at)
      let sorted = [...enriched];
      switch (sortBy) {
        case 'rate-low':
          sorted.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
          break;
        case 'rate-high':
          sorted.sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
          break;
        case 'reliability':
          sorted.sort((a, b) => (b.reliability_score || 0) - (a.reliability_score || 0));
          break;
        case 'distance':
        default:
          sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setLocums(sorted);
    } catch (error) {
      console.error('Error fetching locums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocums();
  }, [sortBy, selectedCity, selectedSpecialty, availabilityDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocums();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedSpecialty("all");
    setNameQuery("");
    setAvailabilityDate("");
    setSortBy("distance");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Dental Locum
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our network of qualified dental professionals. Sign up to book shifts and manage your practice staffing effortlessly.
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <div className="max-w-5xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Name Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-10 h-12 bg-card border-border shadow-sm"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                />
              </div>

              {/* Specialty Dropdown */}
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="pl-10 h-12 bg-card border-border shadow-sm">
                    <SelectValue placeholder="Specialty..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Dropdown */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="pl-10 h-12 bg-card border-border shadow-sm">
                    <SelectValue placeholder="Location..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Locations</SelectItem>
                    {UK_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  type="date"
                  className="pl-10 h-12 bg-card border-border shadow-sm"
                  value={availabilityDate}
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-12 text-lg gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Search className="w-5 h-5" />
              Search Locums
            </Button>
          </form>
        </div>

        {/* Results Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            {isLoading ? "Searching..." : `${locums.length} Locum${locums.length !== 1 ? 's' : ''} found`}
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-10 bg-background border-border shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="distance">Newest First</SelectItem>
                <SelectItem value="rate-low">Price: Low to High</SelectItem>
                <SelectItem value="rate-high">Price: High to Low</SelectItem>
                <SelectItem value="reliability">Highest Reliability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching for locums...</p>
            </div>
          ) : locums.length > 0 ? (
            locums.map((locum) => (
              <Card key={locum.id} className="p-0 border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200 bg-white flex flex-col h-full overflow-hidden">
                <div className="p-5 flex flex-col h-full">
                  {/* Locum Info Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-base flex-shrink-0 border border-slate-200">
                      {getInitials(locum.full_name || "Locum User")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {locum.full_name}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium">
                        {locum.job_type?.[0] || "Dental Professional"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-700 text-[10px]">{locum.avg_rating > 0 ? locum.avg_rating.toFixed(1) : "New"}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded border border-slate-100 shadow-sm">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reliability: {locum.reliability_score || 100}% ({locum.review_count || 0})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{locum.city || "United Kingdom"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{locum.experience_years || 0}+ years exp.</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Starting from</p>
                        <p className="text-xl font-bold text-slate-900 leading-none">
                          £{locum.hourly_rate || 0}<span className="text-sm font-normal text-slate-400">/hr</span>
                        </p>
                      </div>
                      <div className="text-[9px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        GDC Registered
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                       <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                        onClick={() => setViewProfileLocumId(locum.id)}
                      >
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        variant="default" 
                        onClick={() => navigate("/login")} 
                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors"
                      >
                        Book Now
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">No locums found</h3>
              <p className="text-muted-foreground">Try searching in a different city or check back later.</p>
              <Button variant="outline" className="mt-6" onClick={handleClearFilters}>
                View All Locums
              </Button>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-20 bg-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground shadow-2xl overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Are you a Dental Professional?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Join our network of locums and find flexible work that fits your schedule. Sign up today and start earning more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="h-14 px-8 text-lg font-bold" onClick={() => navigate("/login")}>
                Sign Up as a Locum
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>
                <LogIn className="w-5 h-5 mr-2" />
                Log In
              </Button>
            </div>
          </div>
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        </div>
      </main >

      <Footer />
      
      <LocumProfileDialog 
        isOpen={!!viewProfileLocumId}
        onClose={() => setViewProfileLocumId(null)}
        locumId={viewProfileLocumId}
      />
    </div >
  );
}
