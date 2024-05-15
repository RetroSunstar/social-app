import {ChatBskyConvoDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useOnMarkAsRead} from '#/state/queries/messages/list-converations'
import {useAgent} from '#/state/session'
import {RQKEY as LIST_CONVOS_KEY} from './list-converations'

const RQKEY_ROOT = 'convo'
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId]

export function useConvoQuery(
  {convoId}: {convoId: string},
  options?: {initialData: ChatBskyConvoDefs.ConvoView},
) {
  const {getAgent} = useAgent()

  return useQuery({
    queryKey: RQKEY(convoId),
    queryFn: async () => {
      const {data} = await getAgent().api.chat.bsky.convo.getConvo(
        {convoId: convoId},
        {headers: DM_SERVICE_HEADERS},
      )
      return data.convo
    },
    initialData: options?.initialData,
  })
}

export function useMarkAsReadMutation() {
  const optimisticUpdate = useOnMarkAsRead()
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async ({
      convoId,
      messageId,
    }: {
      convoId?: string
      messageId?: string
    }) => {
      if (!convoId) throw new Error('No convoId provided')

      await getAgent().api.chat.bsky.convo.updateRead(
        {
          convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers: DM_SERVICE_HEADERS,
        },
      )
    },
    onMutate({convoId}) {
      if (!convoId) throw new Error('No convoId provided')
      optimisticUpdate(convoId)
    },
    onSettled() {
      queryClient.invalidateQueries({queryKey: LIST_CONVOS_KEY})
    },
  })
}
