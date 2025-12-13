import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface User {
  id: string;
  name: string;
  image: string | null;
}

interface AvatarStackProps {
  users: User[];
  max?: number;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AvatarStack({ users, max = 3 }: AvatarStackProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
      {displayUsers.map((user) => (
        <Avatar key={user.id} className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="text-xs">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar className="size-8">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
