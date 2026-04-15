# Skill: Create React Component

## Usage
Criar um componente React tipado com Tailwind, tratamento de estados e acessibilidade.

## Template

```typescript
// components/[domain]/[ComponentName].tsx
import { type FC } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────
interface [ComponentName]Props {
  // props obrigatórias
  className?: string
}

// ─── Component ────────────────────────────────────────────
const [ComponentName]: FC<[ComponentName]Props> = ({
  className,
  ...props
}) => {
  // estados
  // handlers

  return (
    <div className={cn('', className)}>
      {/* conteúdo */}
    </div>
  )
}

export default [ComponentName]
```

## Estados a tratar sempre
```typescript
// Loading
if (isLoading) return <LoadingSkeleton />

// Error
if (error) return <ErrorMessage message={error.message} />

// Empty
if (!data || data.length === 0) return <EmptyState />

// Success
return <ActualComponent data={data} />
```

## Regras
- Máx. 200 linhas — dividir se necessário
- Sempre tipar props — sem `any`
- Usar `cn()` para classes condicionais
- Tratar loading, error, empty, success
- Acessibilidade: aria-label em elementos interactivos, roles semânticos
- Exportar como named export quando usado em index.ts, default export no ficheiro
