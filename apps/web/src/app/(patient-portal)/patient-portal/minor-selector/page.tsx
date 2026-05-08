'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { UserRole } from '@psyscale/shared-types';
import {
  guardianPortalApi,
  type MinorChild,
} from '@/lib/api/guardian-portal';

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: 'Mere',
  father: 'Pere',
  legal_guardian: 'Tuteur legal',
  other: 'Autre',
};

export default function MinorSelectorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [minors, setMinors] = useState<MinorChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken || session.role !== UserRole.GUARDIAN) return;
    guardianPortalApi
      .getMinors(session.accessToken)
      .then((items) => {
        if (items.length === 1 && items[0]) {
          router.replace(`/patient-portal?minorId=${items[0].patientId}`);
          return;
        }
        setMinors(items);
      })
      .catch(() => {
        /* silently fail */
      })
      .finally(() => setLoading(false));
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <Users className="h-10 w-10 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Vos enfants suivis</h1>
        <p className="text-muted-foreground mt-1">
          Selectionnez un enfant pour acceder a son suivi
        </p>
      </div>
      <div className="space-y-4">
        {minors.map((minor) => {
          const age = minor.birthDate
            ? Math.floor(
                (Date.now() - new Date(minor.birthDate).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )
            : null;
          return (
            <Card
              key={minor.patientId}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() =>
                router.push(`/patient-portal?minorId=${minor.patientId}`)
              }
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{minor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    {age !== null && <span>{age} ans</span>}
                    <span>Suivi par {minor.psychologistName}</span>
                  </div>
                </div>
                <Badge variant="secondary">
                  {RELATIONSHIP_LABELS[minor.relationship] ??
                    minor.relationship}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
