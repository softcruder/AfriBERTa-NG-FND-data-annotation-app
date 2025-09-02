"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/custom-hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Languages, Save, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const AVAILABLE_LANGUAGES = [
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
] as const

type LanguageCode = "ha" | "yo"

export function LanguageManagementPage() {
  const { user, refresh } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>([])
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize selected languages from user data
  useEffect(() => {
    if (user?.translationLanguages) {
      const userLangs = user.translationLanguages.filter((lang): lang is LanguageCode => lang === "ha" || lang === "yo")
      setSelectedLanguages(userLangs)
    }
  }, [user])

  // Check for changes
  useEffect(() => {
    const currentLangs =
      user?.translationLanguages?.filter((lang): lang is LanguageCode => lang === "ha" || lang === "yo") || []
    const currentSet = new Set(currentLangs)
    const selectedSet = new Set(selectedLanguages)

    const hasChanged =
      currentLangs.length !== selectedLanguages.length ||
      selectedLanguages.some(lang => !currentSet.has(lang)) ||
      currentLangs.some(lang => !selectedSet.has(lang))

    setHasChanges(hasChanged)
  }, [selectedLanguages, user?.translationLanguages])

  const handleLanguageToggle = (languageCode: LanguageCode) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        return prev.filter(lang => lang !== languageCode)
      } else {
        if (prev.length >= 2) {
          toast({
            title: "Maximum languages reached",
            description: "You can only select up to 2 translation languages.",
            variant: "destructive",
          })
          return prev
        }
        return [...prev, languageCode]
      }
    })
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setLoading(true)
    try {
      const response = await fetch("/api/users/languages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          translationLanguages: selectedLanguages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update languages")
      }

      await refresh() // Refresh user data

      toast({
        title: "Languages Updated",
        description: "Your translation languages have been updated successfully.",
        variant: "default",
      })

      setHasChanges(false)
    } catch (error) {
      console.error("Failed to update languages:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update translation languages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to leave?")
      if (!confirm) return
    }
    router.push("/dashboard")
  }

  const isDualTranslator = selectedLanguages.length > 1
  const currentRate = isDualTranslator ? "NGN80" : "NGN70"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Languages className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Translation Languages</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage the languages you can translate for annotation tasks
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Languages:</span>
                <div className="flex gap-2">
                  {selectedLanguages.length === 0 ? (
                    <Badge variant="secondary">No languages selected</Badge>
                  ) : (
                    selectedLanguages.map(code => {
                      const lang = AVAILABLE_LANGUAGES.find(l => l.code === code)
                      return (
                        <Badge key={code} variant="default">
                          {lang?.name}
                        </Badge>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Translator Type:</span>
                <Badge variant={isDualTranslator ? "default" : "secondary"}>
                  {isDualTranslator ? "Dual Translator" : "Single Language Translator"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Translation Rate:</span>
                <Badge variant="outline" className="font-mono">
                  {currentRate} per translation
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Available Languages</CardTitle>
              <CardDescription>
                Select the languages you can translate. You can choose up to 2 languages. Dual translators (2+
                languages) receive a higher rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AVAILABLE_LANGUAGES.map(language => (
                <div
                  key={language.code}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Checkbox
                    id={language.code}
                    checked={selectedLanguages.includes(language.code)}
                    onCheckedChange={() => handleLanguageToggle(language.code)}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <label htmlFor={language.code} className="text-sm font-medium cursor-pointer">
                      {language.name}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{language.nativeName}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rate Information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Payment Rates:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Single language translator: NGN70 per translation</li>
                <li>• Dual language translator (2+ languages): NGN80 per translation</li>
                <li>• All annotators: NGN100 per annotation + NGN20 per QA review</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={!hasChanges || loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>

            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
