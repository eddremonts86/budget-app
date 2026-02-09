import { createFileRoute } from '@tanstack/react-router'
import { CategoriesPage } from '@/features/Categories/components/CategoriesPage'

export const Route = createFileRoute('/_dashboard/dashboard/categories')({
  component: CategoriesPage,
})
