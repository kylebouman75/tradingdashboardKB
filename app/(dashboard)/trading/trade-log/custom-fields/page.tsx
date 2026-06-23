import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CustomFieldsManager } from '@/components/trades/custom-fields-manager'

export default function CustomFieldsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eigen velden beheren</h1>
        <Button asChild variant="outline">
          <Link href="/trading/trade-log">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Trade Log
          </Link>
        </Button>
      </div>

      <CustomFieldsManager />
    </div>
  )
}
