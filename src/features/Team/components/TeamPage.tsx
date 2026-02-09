import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconUsers } from '@tabler/icons-react'

export function TeamPage() {
  const members = [
    { id: '1', name: 'Liam Johnson', role: 'Designer', email: 'liam@example.com' },
    { id: '2', name: 'Olivia Smith', role: 'Developer', email: 'olivia@example.com' },
    { id: '3', name: 'Noah Williams', role: 'Manager', email: 'noah@example.com' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center space-x-4 space-y-0 pb-2">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-medium">{member.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">{member.email}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
