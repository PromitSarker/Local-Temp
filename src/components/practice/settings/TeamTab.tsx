import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { EditMemberDialog } from "./EditMemberDialog";
import { TeamMember } from "./types";

interface TeamTabProps {
  members: TeamMember[];
  practiceId: string;
  onMemberUpdated: () => void;
}

export function TeamTab({
  members,
  practiceId,
  onMemberUpdated,
}: TeamTabProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);

  return (
    <Card className="border border-border overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg font-medium">Team Members</CardTitle>
        <Button onClick={() => setInviteOpen(true)} className="w-full sm:w-auto gap-2">
          <Users className="h-4 w-4" />
          Invite Member
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-card"
                style={{ backgroundColor: member.avatar_color }}
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{member.name}</p>
                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <span className="text-sm text-muted-foreground">
                {member.role}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMember(member)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        practiceId={practiceId}
        onSuccess={onMemberUpdated}
      />

      <EditMemberDialog
        member={editMember}
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        onSuccess={onMemberUpdated}
      />
    </Card>
  );
}
