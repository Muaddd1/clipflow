'use client'

import React, { createContext, useContext } from 'react'
import { toast } from 'sonner'

interface ToastContextValue {
  toast: typeof toast
}

const ToastContext = createContext<ToastContextValue>({ toast })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
