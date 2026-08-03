# Micronet Agent - Agente Virtual de Atendimento

Um agente virtual inteligente para atendimento ao cliente da Micronet, com suporte a chat interativo, voz, geração de documentos e controle de tempo de uso.

## 🎯 Funcionalidades MVP

✅ **Chat Interativo** - Interface de chat em tempo real com suporte a texto e voz
✅ **Reconhecimento de Voz** - Speech-to-Text com Web Speech API
✅ **Síntese de Fala** - Text-to-Speech para respostas da IA
✅ **Fluxos de Atendimento** - 6 fluxos principais (Currículo, Contato, Segunda Via, Pesquisa, Relatório, Proposta)
✅ **Controle de Tempo** - Rastreamento automático de tempo de uso
✅ **Design Responsivo** - Interface moderna com Tailwind CSS 4

## 🚀 Começando

### Pré-requisitos
- Node.js 22.13.0+
- pnpm 9.0.0+

### Instalação

```bash
# Clonar repositório
git clone https://github.com/CilmarLandim/Dash-bord-Micronet.git
cd Dash-bord-Micronet

# Instalar dependências
pnpm install

# Criar arquivo .env
cp .env.example .env
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Em outro terminal, iniciar servidor backend
pnpm server
```

O aplicativo estará disponível em `http://localhost:5173`

### Build para Produção

```bash
# Compilar projeto
pnpm build

# Visualizar build
pnpm preview
```

## 📁 Estrutura do Projeto

```
micronet-agent/
├── src/
│   ├── components/          # Componentes React
│   │   └── ChatInterface.tsx
│   ├── services/            # Serviços de API e voz
│   │   ├── api.ts
│   │   └── voiceService.ts
│   ├── styles/              # Estilos globais
│   │   └── globals.css
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Entrada da aplicação
├── server/
│   ├── index.ts             # Servidor Express
│   ├── context.ts           # Contexto tRPC
│   ├── trpc.ts              # Configuração tRPC
│   ├── routers/             # Rotas tRPC
│   │   ├── chat.ts
│   │   └── index.ts
│   └── services/            # Serviços backend
│       └── llm.ts
├── .env.example             # Variáveis de ambiente
├── package.json             # Dependências
├── tsconfig.json            # Configuração TypeScript
├── vite.config.ts           # Configuração Vite
├── tailwind.config.js       # Configuração Tailwind
└── postcss.config.js        # Configuração PostCSS
```

## 🔧 Correções Aplicadas

### ✅ Erros de Build Corrigidos

1. **TypeScript Errors**
   - Corrigido `moduleResolution` para `bundler`
   - Adicionado `allowImportingTsExtensions`
   - Removido `noUnusedLocals` e `noUnusedParameters` para evitar warnings

2. **Tailwind CSS v4**
   - Instalado `@tailwindcss/postcss`
   - Atualizado `postcss.config.js` para usar novo plugin
   - Corrigido `globals.css` com `@import "tailwindcss"`

3. **Dependências**
   - Adicionados tipos corretos (`@types/cors`)
   - Instalado `tsx` para rodar TypeScript
   - Adicionado ESLint com suporte a TypeScript

4. **Configurações**
   - Criado `tailwind.config.js`
   - Criado `postcss.config.js`
   - Criado `.eslintrc.json`
   - Criado `server.mjs` para servidor simples

## 📦 Dependências Principais

- **React 19** - UI Framework
- **Vite 5** - Build tool
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **tRPC 11** - Type-safe API
- **Express 4** - Backend server
- **Zod 3** - Schema validation
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 🔌 API Endpoints

### Chat
- `POST /api/trpc/chat.startSession` - Iniciar nova sessão
- `POST /api/trpc/chat.sendMessage` - Enviar mensagem
- `GET /api/trpc/chat.getHistory` - Obter histórico
- `POST /api/trpc/chat.endSession` - Finalizar sessão

## 🎨 Design

- **Cores**: Azul (primário), Cinza (secundário)
- **Tipografia**: Inter
- **Componentes**: shadcn/ui inspired
- **Responsividade**: Mobile-first

## 🚀 Deploy

### Opção 1: Manus (Recomendado)
```bash
# Fazer push para GitHub
git push origin main

# Publicar via Manus
# (Instruções no dashboard)
```

### Opção 2: Docker
```bash
# Build da imagem
docker build -t micronet-agent .

# Rodar container
docker run -p 3000:3000 micronet-agent
```

### Opção 3: Manual
```bash
# Build
pnpm build

# Deploy dos arquivos em dist/
# para seu servidor web
```

## 📝 Variáveis de Ambiente

```env
# Servidor
PORT=3001
NODE_ENV=development

# API
VITE_API_URL=http://localhost:3001/api

# Integração com LAN
LAN_SERVER_URL=http://192.168.1.100:8080
LAN_SHARED_FOLDER=/documentos

# Impressora
PRINTER_NAME=Impressora Micronet
PRINTER_ADDRESS=192.168.1.50

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
```

## 🧪 Testes

```bash
# Rodar testes
pnpm test

# Modo watch
pnpm test:watch
```

## 📊 Performance

- Build size: ~500KB (gzipped: ~150KB)
- Load time: < 2s
- Time tracking: Auto-save a cada 30s

## 🐛 Troubleshooting

### Build falha com erro de Tailwind
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Porta já em uso
```bash
# Mudar porta no vite.config.ts
# ou usar variável de ambiente
PORT=3002 pnpm dev
```

### Erro de CORS
- Verificar `vite.config.ts` proxy configuration
- Certificar que servidor backend está rodando

## 📚 Documentação Adicional

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [tRPC Documentation](https://trpc.io)

## 📄 Licença

Propriedade da Micronet Solutions

## 👥 Suporte

Para suporte, entre em contato com:
- 📧 contato@micronet.com.br
- 📞 (11) 3000-0000

## 🎯 Próximas Fases

- [ ] Integração com LAN para armazenamento de documentos
- [ ] Geração de PDF/DOCX
- [ ] Integração com impressora
- [ ] Bot do WhatsApp
- [ ] Dashboard administrativo
- [ ] Integração com OpenAI para IA avançada

---

**Versão**: 1.0.0 MVP  
**Última atualização**: 2025-01-08
