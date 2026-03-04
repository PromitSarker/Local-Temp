import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DocumentStatus =
  | "not_uploaded"
  | "uploaded"
  | "pending_review"
  | "approved"
  | "rejected";

export interface DocumentItem {
  id: string; // This corresponds to document_type in DB
  name: string;
  description: string;
  status: DocumentStatus;
  fileName?: string;
  uploadedAt?: Date;
  expiryDate?: Date;
  hasExpiryField?: boolean;
  inputType: "file" | "text" | "both";
  textValue?: string;
  textLabel?: string;
  textPlaceholder?: string;
}

export interface LocumProfile {
  isComplete: boolean;
  isFirstLogin: boolean;
  basicInfo: {
    name: string;
    email: string;
    phone: string;
  };
  documents: DocumentItem[];
  reliabilityScore: number;
  experienceYears?: number;
  hourlyRate?: number;
  bio?: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    county: string;
    postcode: string;
  };
  gdcNumber?: string;
  qualification?: string;
  dob?: string;
  travelRadius?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoverage?: string;
  insuranceExpiry?: string;
  specialization?: string;
}

const documentTemplates: DocumentItem[] = [
  {
    id: "photo_id",
    name: "Photo ID",
    description: "Passport or Driving Licence",
    status: "not_uploaded",
    inputType: "file",
  },
  {
    id: "gdc_registration",
    name: "GDC Registration",
    description: "Active GDC Number",
    status: "not_uploaded",
    inputType: "both",
    textLabel: "GDC Number",
    textPlaceholder: "Enter your GDC number",
  },
  {
    id: "qualification_certificate",
    name: "Qualification Certificate",
    description: "Dental nursing qualification proof",
    status: "not_uploaded",
    inputType: "file",
  },
  {
    id: "enhanced_dbs",
    name: "Enhanced DBS",
    description: "Background check document",
    status: "not_uploaded",
    inputType: "file",
  },
  {
    id: "hepatitis_b",
    name: "Hepatitis B Vaccination",
    description: "Proof of vaccination",
    status: "not_uploaded",
    inputType: "file",
  },
  {
    id: "indemnity_insurance",
    name: "Indemnity Insurance",
    description: "Insurance cover document",
    status: "not_uploaded",
    inputType: "file",
    hasExpiryField: true,
  },
  {
    id: "cpr_certificate",
    name: "CPR Certificate",
    description: "Valid life support training",
    status: "not_uploaded",
    inputType: "file",
    hasExpiryField: true,
  },
  {
    id: "safeguarding_level_2",
    name: "Safeguarding Level 2",
    description: "Training certificate",
    status: "not_uploaded",
    inputType: "file",
  },
  {
    id: "cv",
    name: "CV",
    description: "Recent and complete CV (PDF/DOC)",
    status: "not_uploaded",
    inputType: "file",
  },
];

export function useLocumProfile() {
  const [profile, setProfile] = useState<LocumProfile>({
    isComplete: false,
    isFirstLogin: true,
    basicInfo: {
      name: "Loading...",
      email: "",
      phone: "",
    },
    documents: documentTemplates,
    reliabilityScore: 100,
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile and documents from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single() as { data: any, error: any };

        // Fetch documents
        const { data: documentsData } = await supabase
          .from("locum_documents")
          .select("*")
          .eq("profile_id", profileData?.id);

        // Merge templates with saved documents
        const mergedDocuments = documentTemplates.map((template) => {
          const savedDoc = documentsData?.find((d) => d.document_type === template.id);
          if (savedDoc) {
            return {
              ...template,
              status: savedDoc.status as DocumentStatus,
              fileName: savedDoc.file_name || undefined,
              textValue: savedDoc.text_value || undefined,
              expiryDate: savedDoc.expiry_date ? new Date(savedDoc.expiry_date) : undefined,
              uploadedAt: savedDoc.created_at ? new Date(savedDoc.created_at) : undefined,
            };
          }
          return template;
        });

        setProfile({
          isComplete: false,
          isFirstLogin: true,
          basicInfo: {
            name: profileData?.full_name || "User",
            email: profileData?.email || "",
            phone: profileData?.phone || "",
          },
          documents: mergedDocuments,
          reliabilityScore: profileData?.reliability_score ?? 100,
          experienceYears: profileData?.experience_years || 0,
          hourlyRate: profileData?.hourly_rate || 0,
          bio: profileData?.bio || "",
          address: {
            line1: profileData?.address_line1 || "",
            line2: profileData?.address_line2 || "",
            city: profileData?.city || "",
            county: profileData?.county || "",
            postcode: profileData?.postcode || "",
          },
          gdcNumber: profileData?.gdc_number || "",
          qualification: profileData?.qualification || "",
          dob: profileData?.dob || "",
          travelRadius: profileData?.travel_radius || 0,
          insuranceProvider: profileData?.insurance_provider || "",
          insurancePolicyNumber: profileData?.insurance_policy_number || "",
          insuranceCoverage: profileData?.insurance_coverage || "",
          insuranceExpiry: profileData?.insurance_expiry || "",
          specialization: profileData?.job_type?.[0] || "other",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const completionPercentage = useMemo(() => {
    const uploadedCount = profile.documents.filter(
      (doc) => doc.status !== "not_uploaded",
    ).length;
    return Math.round((uploadedCount / profile.documents.length) * 100);
  }, [profile.documents]);

  const isProfileComplete = useMemo(() => {
    return profile.documents.every((doc) => doc.status !== "not_uploaded");
  }, [profile.documents]);

  const uploadDocument = useCallback(
    async (
      documentId: string,
      fileName: string,
      textValue?: string,
      expiryDate?: Date,
    ) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profileData) return;

        // Upsert document to database
        await supabase.from("locum_documents").upsert({
          profile_id: profileData.id,
          document_type: documentId,
          file_name: fileName,
          text_value: textValue,
          expiry_date: expiryDate?.toISOString().split('T')[0],
          status: "uploaded",
        }, {
          onConflict: "profile_id,document_type"
        });

        // Update local state
        setProfile((prev) => ({
          ...prev,
          documents: prev.documents.map((doc) =>
            doc.id === documentId
              ? {
                ...doc,
                status: "uploaded" as DocumentStatus,
                fileName,
                textValue,
                expiryDate,
                uploadedAt: new Date(),
              }
              : doc,
          ),
        }));
      } catch (error) {
        console.error("Error uploading document:", error);
      }
    },
    [],
  );

  const markFirstLoginComplete = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      isFirstLogin: false,
    }));
  }, []);

  const updateLocumProfile = useCallback(async (updates: Partial<{
    name: string;
    phone: string;
    experienceYears: number;
    hourlyRate: number;
    bio: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      county?: string;
      postcode?: string;
    };
    gdcNumber?: string;
    qualification?: string;
    dob?: string;
    travelRadius?: number;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceCoverage?: string;
    insuranceExpiry?: string;
    specialization?: string;
  }>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileUpdates: any = {};
      if (updates.name !== undefined) profileUpdates.full_name = updates.name;
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (updates.experienceYears !== undefined) profileUpdates.experience_years = updates.experienceYears;
      if (updates.hourlyRate !== undefined) profileUpdates.hourly_rate = updates.hourlyRate;
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
      if (updates.specialization !== undefined) profileUpdates.job_type = [updates.specialization];

      if (updates.address) {
        if (updates.address.line1 !== undefined) profileUpdates.address_line1 = updates.address.line1;
        if (updates.address.line2 !== undefined) profileUpdates.address_line2 = updates.address.line2;
        if (updates.address.city !== undefined) profileUpdates.city = updates.address.city;
        if (updates.address.county !== undefined) profileUpdates.county = updates.address.county;
        if (updates.address.postcode !== undefined) profileUpdates.postcode = updates.address.postcode;
      }

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          name: updates.name ?? prev.basicInfo.name,
          phone: updates.phone ?? prev.basicInfo.phone,
        },
        experienceYears: updates.experienceYears ?? prev.experienceYears,
        hourlyRate: updates.hourlyRate ?? prev.hourlyRate,
        bio: updates.bio ?? prev.bio,
        address: updates.address ? {
          ...prev.address!,
          ...updates.address
        } : prev.address,
        gdcNumber: updates.gdcNumber ?? prev.gdcNumber,
        qualification: updates.qualification ?? prev.qualification,
        dob: updates.dob ?? prev.dob,
        travelRadius: updates.travelRadius ?? prev.travelRadius,
        insuranceProvider: updates.insuranceProvider ?? prev.insuranceProvider,
        insurancePolicyNumber: updates.insurancePolicyNumber ?? prev.insurancePolicyNumber,
        insuranceCoverage: updates.insuranceCoverage ?? prev.insuranceCoverage,
        insuranceExpiry: updates.insuranceExpiry ?? prev.insuranceExpiry,
        specialization: updates.specialization ?? prev.specialization,
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }, []);

  const getDocumentById = useCallback(
    (id: string) => {
      return profile.documents.find((doc) => doc.id === id);
    },
    [profile.documents],
  );

  return {
    profile,
    completionPercentage,
    isProfileComplete,
    uploadDocument,
    markFirstLoginComplete,
    getDocumentById,
    updateLocumProfile,
    loading,
  };
}
