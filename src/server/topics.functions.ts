import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { findTopic, getGtaGame, listTopics } from './topics.server'

export const getNews = createServerFn({ method: 'GET' }).handler(() =>
  listTopics(),
)

export const getTopic = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      slug: z
        .string()
        .min(1)
        .max(160)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }),
  )
  .handler(({ data }) => findTopic(data.slug))

export const getGameNews = createServerFn({ method: 'GET' }).handler(() =>
  getGtaGame(),
)
