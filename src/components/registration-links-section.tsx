import { useState } from "react";
import { Copy, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useProjectRegistrationLinks,
  useCreateProjectRegistrationLink,
} from "@/lib/queries/project-registration-links";

interface RegistrationLinksSectionProps {
  projectId: string;
}

export function RegistrationLinksSection({ projectId }: RegistrationLinksSectionProps) {
  const { data: links } = useProjectRegistrationLinks(projectId);
  const createLink = useCreateProjectRegistrationLink();
  const [copying, setCopying] = useState<string | null>(null);

  const handleCopyLink = async (link: string, type: string) => {
    setCopying(type);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("הקישור הועתק בהצלחה!");
    } catch (err) {
      toast.error("שגיאה בהעתקת הקישור");
    } finally {
      setCopying(null);
    }
  };

  const handleCreateLink = (type: "volunteer" | "participant") => {
    createLink.mutate({ projectId, linkType: type });
  };

  const volunteerLink = links?.find((l) => l.linkType === "volunteer");
  const participantLink = links?.find((l) => l.linkType === "participant");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">קישורי הרשמה</h3>

      {/* Volunteer Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">קישור הרשמה למתנדבים</label>
        {volunteerLink?.fullUrl ? (
          <div className="flex gap-2">
            <Input
              type="text"
              readOnly
              value={volunteerLink.fullUrl}
              className="text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              disabled={copying === "volunteer"}
              onClick={() => handleCopyLink(volunteerLink.fullUrl!, "volunteer")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateLink("volunteer")}
            disabled={createLink.isPending}
          >
            {createLink.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                יוצר קישור...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                 קישור
              </>
            )}
          </Button>
        )}
      </div>

      {/* Participant Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">קישור הרשמה למשתתפים</label>
        {participantLink?.fullUrl ? (
          <div className="flex gap-2">
            <Input
              type="text"
              readOnly
              value={participantLink.fullUrl}
              className="text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              disabled={copying === "participant"}
              onClick={() =>
                handleCopyLink(participantLink.fullUrl!, "participant")
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateLink("participant")}
            disabled={createLink.isPending}
          >
            {createLink.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                יוצר קישור...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                 קישור
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
