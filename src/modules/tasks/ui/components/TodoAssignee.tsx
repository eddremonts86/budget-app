import { UserCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { UserInfo } from '../../hooks/useUserMap'

interface TodoAssigneeProps {
  assignee?: UserInfo
}

export function TodoAssignee({ assignee }: TodoAssigneeProps) {
  if (!assignee) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <UserCircle className="w-4 h-4 opacity-50" />
        <span className="text-xs">—</span>
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={assignee.avatar} alt={assignee.name} />
            <AvatarFallback className="text-[10px]">
              {assignee.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground truncate max-w-25">
            {assignee.name}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{assignee.name}</p>
      </TooltipContent>
    </Tooltip>
  )
}
