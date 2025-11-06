import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time Event Interface
 */
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'projects' | 'units';
  data: any;
  old?: any;
}

/**
 * Real-time Event Handler
 */
export type RealtimeEventHandler = (event: RealtimeEvent) => void;

/**
 * Project Real-time Sync
 *
 * Manages real-time subscriptions for project and unit updates using Supabase Realtime.
 * Automatically handles connection management and cleanup.
 *
 * Features:
 * - Subscribe to specific project changes
 * - Subscribe to all user's projects
 * - Subscribe to unit changes within a project
 * - Automatic reconnection
 * - Clean subscription cleanup
 *
 * @example
 * const sync = new ProjectRealtimeSync(supabase);
 *
 * // Subscribe to project updates
 * sync.subscribeToProject('proj-123', (event) => {
 *   console.log('Project updated:', event);
 * });
 *
 * // Subscribe to unit updates
 * sync.subscribeToUnits('proj-123', (event) => {
 *   if (event.type === 'UPDATE') {
 *     updateUnitInUI(event.data);
 *   }
 * });
 *
 * // Cleanup when done
 * sync.unsubscribeAll();
 */
export class ProjectRealtimeSync {
  private readonly supabase: SupabaseClient;
  private readonly channels: Map<string, RealtimeChannel>;
  private readonly handlers: Map<string, RealtimeEventHandler>;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.channels = new Map();
    this.handlers = new Map();
  }

  /**
   * Subscribe to changes for a specific project
   *
   * Receives events when project metadata is updated (name, location, description, etc.)
   *
   * @param projectId - Project ID to subscribe to
   * @param handler - Event handler function
   * @returns Channel ID for managing subscription
   */
  subscribeToProject(projectId: string, handler: RealtimeEventHandler): string {
    const channelId = `project:${projectId}`;

    // Check if already subscribed
    if (this.channels.has(channelId)) {
      console.warn(`Already subscribed to project ${projectId}`);
      return channelId;
    }

    // Create channel
    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'projects',
            data: payload.new,
            old: payload.old,
          };
          handler(event);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to project ${projectId}`);
        }
      });

    // Store channel and handler
    this.channels.set(channelId, channel);
    this.handlers.set(channelId, handler);

    return channelId;
  }

  /**
   * Subscribe to unit changes within a project
   *
   * Receives events when units are added, updated, or deleted.
   *
   * @param projectId - Project ID
   * @param handler - Event handler function
   * @returns Channel ID for managing subscription
   */
  subscribeToUnits(projectId: string, handler: RealtimeEventHandler): string {
    const channelId = `units:${projectId}`;

    // Check if already subscribed
    if (this.channels.has(channelId)) {
      console.warn(`Already subscribed to units for project ${projectId}`);
      return channelId;
    }

    // Create channel
    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'units',
            data: payload.new,
            old: payload.old,
          };
          handler(event);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to units for project ${projectId}`);
        }
      });

    // Store channel and handler
    this.channels.set(channelId, channel);
    this.handlers.set(channelId, handler);

    return channelId;
  }

  /**
   * Subscribe to all projects owned by a user
   *
   * Receives events when user's projects are created, updated, or deleted.
   *
   * @param userId - User ID
   * @param handler - Event handler function
   * @returns Channel ID for managing subscription
   */
  subscribeToUserProjects(userId: string, handler: RealtimeEventHandler): string {
    const channelId = `user-projects:${userId}`;

    // Check if already subscribed
    if (this.channels.has(channelId)) {
      console.warn(`Already subscribed to projects for user ${userId}`);
      return channelId;
    }

    // Create channel
    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'projects',
            data: payload.new,
            old: payload.old,
          };
          handler(event);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to projects for user ${userId}`);
        }
      });

    // Store channel and handler
    this.channels.set(channelId, channel);
    this.handlers.set(channelId, handler);

    return channelId;
  }

  /**
   * Subscribe to both project and units changes in one call
   *
   * Convenience method that creates two subscriptions.
   *
   * @param projectId - Project ID
   * @param handler - Event handler function (receives events from both sources)
   * @returns Array of channel IDs [projectChannelId, unitsChannelId]
   */
  subscribeToProjectAndUnits(projectId: string, handler: RealtimeEventHandler): string[] {
    const projectChannelId = this.subscribeToProject(projectId, handler);
    const unitsChannelId = this.subscribeToUnits(projectId, handler);
    return [projectChannelId, unitsChannelId];
  }

  /**
   * Unsubscribe from a specific channel
   *
   * @param channelId - Channel ID returned from subscribe method
   */
  unsubscribe(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelId);
      this.handlers.delete(channelId);
      console.log(`Unsubscribed from ${channelId}`);
    }
  }

  /**
   * Unsubscribe from all channels
   *
   * Call this when component unmounts or user logs out.
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelId) => {
      this.supabase.removeChannel(channel);
      console.log(`Unsubscribed from ${channelId}`);
    });
    this.channels.clear();
    this.handlers.clear();
  }

  /**
   * Get list of active channel IDs
   *
   * @returns Array of channel IDs
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if subscribed to a specific channel
   *
   * @param channelId - Channel ID to check
   * @returns true if subscribed
   */
  isSubscribed(channelId: string): boolean {
    return this.channels.has(channelId);
  }

  /**
   * Get channel status
   *
   * @param channelId - Channel ID
   * @returns Channel state or null if not found
   */
  getChannelStatus(channelId: string): string | null {
    const channel = this.channels.get(channelId);
    return channel ? channel.state : null;
  }
}

/**
 * React Hook for Project Real-time Sync (for future UI integration)
 *
 * Example usage in React:
 * ```tsx
 * function ProjectView({ projectId }) {
 *   const [project, setProject] = useState(null);
 *   const supabase = useSupabaseClient();
 *
 *   useEffect(() => {
 *     const sync = new ProjectRealtimeSync(supabase);
 *
 *     // Subscribe to updates
 *     sync.subscribeToProjectAndUnits(projectId, (event) => {
 *       // Update UI based on event
 *       if (event.table === 'units') {
 *         // Handle unit update
 *         refetchProject();
 *       }
 *     });
 *
 *     // Cleanup on unmount
 *     return () => sync.unsubscribeAll();
 *   }, [projectId]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
