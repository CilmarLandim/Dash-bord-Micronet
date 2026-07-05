import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { videoService } from '../services/videoService';

export const videoRouter = router({
  generateSpeech: publicProcedure
    .input(
      z.object({
        text: z.string(),
        avatarId: z.string().optional(),
        voiceId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await videoService.generateAvatarSpeech(input);
        return {
          success: true,
          videoId: result.video_id,
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    }),

  getStatus: publicProcedure
    .input(
      z.object({
        videoId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await videoService.getVideoStatus(input.videoId);
        return {
          success: true,
          status: result.status, // processing, completed, failed
          videoUrl: result.video_url,
          thumbnailUrl: result.thumbnail_url,
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    }),

  getAvatars: publicProcedure.query(async () => {
    try {
      const result = await videoService.listAvatars();
      return {
        success: true,
        avatars: result.avatars,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }),
});
