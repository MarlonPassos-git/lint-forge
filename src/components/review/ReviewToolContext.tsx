import { createContext, useContext } from 'react'
import { biomeTool } from '../../domain/tools/biome'

export const ReviewToolContext = createContext(biomeTool)

export function useReviewTool() {
  return useContext(ReviewToolContext)
}
