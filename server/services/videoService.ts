import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_API_URL = 'https://api.heygen.com/v2';

interface VideoGenerationRequest {
  text: string;
  avatarId?: string;
  voiceId?: string;
}

export const videoService = {
  /**
   * Gera um vídeo curto com avatar falando o texto fornecido
   */
  generateAvatarSpeech: async ({ text, avatarId = 'josh_lite_20230714', voiceId = 'en-US-Standard-C' }: VideoGenerationRequest) => {
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY não configurada no ambiente');
    }

    try {
      const response = await axios.post(
        `${HEYGEN_API_URL}/video/generate`,
        {
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarId,
                avatar_style: 'normal',
              },
              voice: {
                type: 'text',
                input_text: text,
                voice_id: voiceId,
              },
            },
          ],
          dimension: {
            width: 1280,
            height: 720,
          },
        },
        {
          headers: {
            'X-Api-Key': HEYGEN_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao chamar API do HeyGen:', error.response?.data || error.message);
      throw new Error(`Falha na geração de vídeo HeyGen: ${error.response?.data?.error?.message || error.message}`);
    }
  },

  /**
   * Verifica o status de um vídeo em geração
   */
  getVideoStatus: async (videoId: string) => {
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY não configurada no ambiente');
    }

    try {
      const response = await axios.get(`${HEYGEN_API_URL}/video_status.get?video_id=${videoId}`, {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao verificar status do vídeo:', error.response?.data || error.message);
      throw new Error(`Falha ao verificar status do vídeo: ${error.response?.data?.error?.message || error.message}`);
    }
  },

  /**
   * Lista avatares disponíveis
   */
  listAvatars: async () => {
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY não configurada no ambiente');
    }

    try {
      const response = await axios.get(`${HEYGEN_API_URL}/avatars`, {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao listar avatares:', error.response?.data || error.message);
      throw new Error('Falha ao listar avatares');
    }
  },
};
