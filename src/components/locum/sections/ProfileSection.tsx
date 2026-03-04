import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  FileText,
  Check,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocumProfile, type LocumProfile } from "@/hooks/useLocumProfile";
import { useToast } from "@/hooks/use-toast";
import { UK_CITIES } from "@/data/uk-cities";

const ROLE_CONSTRAINTS = {
  dentist: { min: 60, max: 100 },
  hygienist: { min: 30, max: 45 },
  therapist: { min: 30, max: 45 },
  ortho_therapist: { min: 30, max: 45 },
  other: { min: 18, max: 100 }, // Default / Other roles
};

interface ProfileSectionProps {
  profile: LocumProfile;
  completionPercentage: number;
  isProfileComplete: boolean;
}

export function ProfileSection({
  profile,
  completionPercentage,
  isProfileComplete,
}: ProfileSectionProps) {
  const { updateLocumProfile } = useLocumProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [editData, setEditData] = useState({
    experienceYears: profile.experienceYears || 0,
    hourlyRate: profile.hourlyRate || 0,
    bio: profile.bio || "",
    gdcNumber: profile.gdcNumber || "",
    qualification: profile.qualification || "",
    dob: profile.dob || "",
    travelRadius: profile.travelRadius || 0,
    insuranceProvider: profile.insuranceProvider || "",
    insurancePolicyNumber: profile.insurancePolicyNumber || "",
    insuranceCoverage: profile.insuranceCoverage || "",
    insuranceExpiry: profile.insuranceExpiry || "",
    specialization: profile.specialization || "other",
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioEdit, setBioEdit] = useState(profile.bio || "");

  const [addressData, setAddressData] = useState({
    addressLine1: profile.address?.line1 || "",
    addressLine2: profile.address?.line2 || "",
    city: profile.address?.city || "",
    county: profile.address?.county || "",
    postcode: profile.address?.postcode || "",
  });

  // Update address and professional data when profile loads
  useEffect(() => {
    if (profile) {
      setAddressData({
        addressLine1: profile.address?.line1 || "",
        addressLine2: profile.address?.line2 || "",
        city: profile.address?.city || "",
        county: profile.address?.county || "",
        postcode: profile.address?.postcode || "",
      });
      setEditData({
        experienceYears: profile.experienceYears || 0,
        hourlyRate: profile.hourlyRate || 0,
        bio: profile.bio || "",
        gdcNumber: profile.gdcNumber || "",
        qualification: profile.qualification || "",
        dob: profile.dob || "",
        travelRadius: profile.travelRadius || 0,
        insuranceProvider: profile.insuranceProvider || "",
        insurancePolicyNumber: profile.insurancePolicyNumber || "",
        insuranceCoverage: profile.insuranceCoverage || "",
        insuranceExpiry: profile.insuranceExpiry || "",
        specialization: profile.specialization || "other",
      });
    }
  }, [profile]);

  const uploadedCount = profile.documents.filter(
    (doc) => doc.status !== "not_uploaded",
  ).length;

  const handleSave = async () => {
    try {
      // Validate rate
      const role = editData.specialization as keyof typeof ROLE_CONSTRAINTS;
      const constraint = ROLE_CONSTRAINTS[role] || ROLE_CONSTRAINTS.other;

      if (editData.hourlyRate < constraint.min || editData.hourlyRate > constraint.max) {
        toast({
          title: "Invalid Rate",
          description: `For ${role}, the rate must be between £${constraint.min} and £${constraint.max}`,
          variant: "destructive",
        });
        return;
      }

      if (editData.experienceYears >= 2 && editData.hourlyRate < 18) {
        toast({
          title: "Invalid Rate",
          description: "With 2+ years of experience, you are eligible for at least £18 per hour.",
          variant: "destructive",
        });
        return;
      }

      await updateLocumProfile({
        experienceYears: editData.experienceYears,
        hourlyRate: editData.hourlyRate,
        bio: editData.bio,
        gdcNumber: editData.gdcNumber,
        qualification: editData.qualification,
        dob: editData.dob,
        travelRadius: editData.travelRadius,
        insuranceProvider: editData.insuranceProvider,
        insurancePolicyNumber: editData.insurancePolicyNumber,
        insuranceCoverage: editData.insuranceCoverage,
        insuranceExpiry: editData.insuranceExpiry,
        specialization: editData.specialization,
      });

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your professional details have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error saving your changes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Profile</h2>

      {/* Profile Completion Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Profile Completion</h3>
            <p className="text-sm text-muted-foreground">
              {uploadedCount} of {profile.documents.length} documents uploaded
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {completionPercentage}%
          </div>
        </div>
        <Progress value={completionPercentage} className="h-3 mb-4" />
        <div className="flex items-center gap-2">
          {isProfileComplete ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">
                Profile complete - You can apply for shifts
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-amber-600 font-medium">
                Complete your documents to apply for shifts
              </span>
            </>
          )}
        </div>
        {!isProfileComplete && (
          <Button asChild className="mt-4">
            <Link to="/locum-dashboard/documents">Upload Documents</Link>
          </Button>
        )}
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg mb-6">
          <TabsTrigger
            value="personal"
            className="flex-1 data-[state=active]:bg-emerald-700 data-[state=active]:text-white rounded-md py-2 transition-all"
          >
            Personal
          </TabsTrigger>
          <TabsTrigger
            value="professional"
            className="flex-1 data-[state=active]:bg-emerald-700 data-[state=active]:text-white rounded-md py-2 transition-all"
          >
            Professional
          </TabsTrigger>
          <TabsTrigger
            value="availability"
            className="flex-1 data-[state=active]:bg-emerald-700 data-[state=active]:text-white rounded-md py-2 transition-all"
          >
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditingPersonal(true)}>
                Edit
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <Avatar className="w-24 h-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.basicInfo.name}`} />
                <AvatarFallback className="bg-emerald-700 text-white text-2xl">
                  {profile.basicInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-fit" onClick={() => toast({ title: "Coming Soon", description: "Profile photo upload will be available shortly." })}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  defaultValue={profile.basicInfo.name}
                  className="bg-muted/30"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  defaultValue={profile.basicInfo.email}
                  className="bg-muted/30"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  defaultValue={profile.basicInfo.phone}
                  className="bg-muted/30"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={editData.dob}
                  onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                  className={isEditingPersonal ? "" : "bg-muted/30"}
                  readOnly={!isEditingPersonal}
                />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Address</Label>
                {!isEditingPersonal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPersonal(true)}
                  >
                    Edit Address
                  </Button>
                )}
              </div>
              <Input
                placeholder="Address Line 1"
                value={addressData.addressLine1}
                onChange={(e) => setAddressData({ ...addressData, addressLine1: e.target.value })}
                className={isEditingPersonal ? "" : "bg-muted/30"}
                readOnly={!isEditingPersonal}
              />
              <Input
                placeholder="Address Line 2 (Optional)"
                value={addressData.addressLine2}
                onChange={(e) => setAddressData({ ...addressData, addressLine2: e.target.value })}
                className={isEditingPersonal ? "" : "bg-muted/30"}
                readOnly={!isEditingPersonal}
              />
              <div className="grid md:grid-cols-3 gap-4">
                {isEditingPersonal ? (
                  <Select
                    value={addressData.city}
                    onValueChange={(value) => setAddressData({ ...addressData, city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {UK_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={addressData.city || "Select city"} className="bg-muted/30" readOnly />
                )}
                <Input
                  placeholder="Postcode"
                  value={addressData.postcode}
                  onChange={(e) => setAddressData({ ...addressData, postcode: e.target.value })}
                  className={isEditingPersonal ? "" : "bg-muted/30"}
                  readOnly={!isEditingPersonal}
                />
                <Input
                  placeholder="County"
                  value={addressData.county}
                  onChange={(e) => setAddressData({ ...addressData, county: e.target.value })}
                  className={isEditingPersonal ? "" : "bg-muted/30"}
                  readOnly={!isEditingPersonal}
                />
              </div>
              {isEditingPersonal && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        await updateLocumProfile({
                          address: {
                            line1: addressData.addressLine1,
                            line2: addressData.addressLine2,
                            city: addressData.city,
                            county: addressData.county,
                            postcode: addressData.postcode,
                          }
                        });
                        toast({
                          title: "Address Saved",
                          description: "Your address has been updated",
                        });
                        setIsEditingPersonal(false);
                      } catch (error) {
                        toast({
                          title: "Update Failed",
                          description: "There was an error saving your address",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    Save Address
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPersonal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Biography</Label>
                {!isEditingBio && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBioEdit(profile.bio || "");
                      setIsEditingBio(true);
                    }}
                  >
                    Edit Bio
                  </Button>
                )}
              </div>
              {isEditingBio ? (
                <div className="space-y-4">
                  <Textarea
                    className="min-h-[150px]"
                    value={bioEdit}
                    onChange={(e) => setBioEdit(e.target.value)}
                    placeholder="Tell practices about your experience and skills..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await updateLocumProfile({ bio: bioEdit });
                          toast({
                            title: "Bio Updated",
                            description: "Your biography has been saved.",
                          });
                          setIsEditingBio(false);
                        } catch (error) {
                          toast({
                            title: "Update Failed",
                            description: "Could not save bio.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      Save Bio
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingBio(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Textarea
                  className="bg-muted/30 min-h-[100px]"
                  value={profile.bio || "No biography added yet. Click edit to add one."}
                  readOnly
                />
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  Professional Credentials
                </h3>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={isEditing ? "bg-emerald-700 hover:bg-emerald-800" : ""}
                >
                  {isEditing ? "Save Changes" : "Edit"}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label>GDC Number</Label>
                  <Input
                    value={editData.gdcNumber}
                    onChange={(e) => setEditData({ ...editData, gdcNumber: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                    placeholder="Enter GDC number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization / Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editData.specialization}
                    onChange={(e) => setEditData({ ...editData, specialization: e.target.value })}
                    disabled={!isEditing}
                  >
                    <option value="dentist">Dentist</option>
                    <option value="hygienist">Hygienist</option>
                    <option value="therapist">Therapist</option>
                    <option value="ortho_therapist">Ortho Therapist</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={editData.experienceYears}
                    onChange={(e) => setEditData({ ...editData, experienceYears: parseInt(e.target.value) || 0 })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={editData.qualification}
                    onChange={(e) => setEditData({ ...editData, qualification: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                    placeholder="e.g. BDS, MFDS RCS"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Label>Key Skills & Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    Root Canal Treatment
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    Crown & Bridge
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    Cosmetic Dentistry
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    Pediatric Dentistry
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    Implantology
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Label>Willing to Work With</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="corporate" checked disabled />
                    <label
                      htmlFor="corporate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Corporate Practices
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="independent" checked disabled />
                    <label
                      htmlFor="independent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Independent Practices
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Label>Practice Type Preference</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="nhs" checked disabled />
                    <label
                      htmlFor="nhs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      NHS
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="private" checked disabled />
                    <label
                      htmlFor="private"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Private
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="mixed" checked disabled />
                    <label
                      htmlFor="mixed"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mixed
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Maximum Travel Distance</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={editData.travelRadius}
                      onChange={(e) => setEditData({ ...editData, travelRadius: parseInt(e.target.value) || 0 })}
                      className={isEditing ? "pr-12" : "bg-muted/30 pr-12"}
                      readOnly={!isEditing}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                      miles
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                      £
                    </span>
                    <Input
                      type="number"
                      value={editData.hourlyRate}
                      onChange={(e) => setEditData({ ...editData, hourlyRate: parseInt(e.target.value) || 0 })}
                      className={isEditing ? "pl-7 pr-12" : "bg-muted/30 pl-7 pr-12"}
                      readOnly={!isEditing}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                      / hour
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">
                Indemnity Insurance
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={editData.insuranceProvider}
                    onChange={(e) => setEditData({ ...editData, insuranceProvider: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                    placeholder="e.g. Dental Protection"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={editData.insurancePolicyNumber}
                    onChange={(e) => setEditData({ ...editData, insurancePolicyNumber: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                    placeholder="Enter policy number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Amount</Label>
                  <Input
                    value={editData.insuranceCoverage}
                    onChange={(e) => setEditData({ ...editData, insuranceCoverage: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                    placeholder="e.g. £10,000,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={editData.insuranceExpiry}
                    onChange={(e) => setEditData({ ...editData, insuranceExpiry: e.target.value })}
                    className={isEditing ? "" : "bg-muted/30"}
                    readOnly={!isEditing}
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                Weekly Availability
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Set your regular working days. These will be shown as available on the calendar.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  { day: "Monday", active: true },
                  { day: "Tuesday", active: true },
                  { day: "Wednesday", active: true },
                  { day: "Thursday", active: true },
                  { day: "Friday", active: true },
                  { day: "Saturday", active: false },
                  { day: "Sunday", active: false },
                ].map((item) => (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between p-4 border rounded-lg ${!item.active ? "opacity-60 bg-muted/20" : "bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`day-${item.day.toLowerCase()}`}
                        defaultChecked={item.active}
                      />
                      <Label
                        htmlFor={`day-${item.day.toLowerCase()}`}
                        className="text-base font-normal cursor-pointer"
                      >
                        {item.day}
                      </Label>
                    </div>
                    <div>
                      <Badge variant={item.active ? "secondary" : "outline"} className={item.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                        {item.active ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-6 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
                Save Weekly Patterns
              </Button>
            </Card>

            {/* Holiday section removed as requested */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
