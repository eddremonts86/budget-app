import { createFileRoute } from '@tanstack/react-router'
import { CategoriesPage } from '@/modules/categories'

export const Route = createFileRoute('/_dashboard/dashboard/categories')({
  component: CategoriesPage,
})
