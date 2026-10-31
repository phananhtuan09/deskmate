import { useRpc } from "@getpaseo/plugin/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { parseState, type DeskmateState } from "../shared/core";
import { deskmateCommand, type DeskmateRpcCommand, type DeskmateRpcResult } from "../shared/contract";

export type DeskmateMutation = Exclude<DeskmateRpcCommand, { type: "read" }>;

function accepted(result: DeskmateRpcResult): DeskmateState {
  if (!result.ok || !result.state) throw new Error(result.error ?? "Could not update Deskmate.");
  return parseState(JSON.stringify(result.state));
}

export function useDeskmate(hostId: string) {
  const call = useRpc(deskmateCommand);
  const queryClient = useQueryClient();
  const queryKey = ["deskmate", hostId] as const;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey,
    queryFn: async () => accepted(await call({ type: "read" })),
    refetchInterval: 1000,
    refetchOnMount: "always",
    retry: 1,
  });
  const mutation = useMutation({
    mutationFn: async (command: Exclude<DeskmateRpcCommand, { type: "read" }>) => accepted(await call(command)),
    onSuccess(state) {
      queryClient.setQueryData(queryKey, state);
    },
  });
  return { state: query.data, loading: query.isPending, error: query.error, refetch: query.refetch, now, busy: mutation.isPending, run: mutation.mutateAsync };
}
