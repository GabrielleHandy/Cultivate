import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { ModelConfig } from '@/constants/types'
import { saveModelConfig, loadModelConfig, clearModelConfig } from '@/utils/storage'
import { testModelConnection } from '@/utils/modelAdapter'
import { type Theme, Spacing, Radius, Typography } from '@/constants/theme'
import { useTheme, THEMES, type ThemeKey } from '@/contexts/ThemeContext'

const PRESETS = [
  { label: 'Ollama (local)', url: 'http://localhost:11434/v1/chat/completions', model: 'llama3.2' },
  { label: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'mistralai/mistral-7b-instruct' },
  { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
]

const THEME_LABELS: Record<ThemeKey, string> = {
  default: '🌿 Default',
  // darkAcademia: '📚 Dark Academia',
  // y2k: '💿 Y2K',
  // cleanGirl: '🤍 Clean Girl',
  // disneyChannel: '🌟 Disney Channel',
}

export default function SettingsScreen() {
  const { theme, themeKey, setThemeKey } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const [url, setUrl] = useState('')
  const [modelName, setModelName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [label, setLabel] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [currentConfig, setCurrentConfig] = useState<ModelConfig | null>(null)

  useEffect(() => {
    loadModelConfig().then(config => {
      if (config) {
        setCurrentConfig(config)
        setUrl(config.url)
        setModelName(config.model)
        setApiKey(config.apiKey || '')
        setLabel(config.label || '')
      }
    })
  }, [])

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setUrl(preset.url)
    setModelName(preset.model)
    setLabel(preset.label)
    setTestStatus(null)
    setSaved(false)
  }

  const handleTest = async () => {
    if (!url || !modelName) {
      Alert.alert('Missing fields', 'Enter an endpoint URL and model name first.')
      return
    }
    setTesting(true)
    setTestStatus(null)
    const result = await testModelConnection({ url, model: modelName, apiKey: apiKey || undefined, label })
    setTestStatus(result)
    setTesting(false)
  }

  const handleSave = async () => {
    if (!url || !modelName) {
      Alert.alert('Missing fields', 'Endpoint URL and model name are required.')
      return
    }
    const config: ModelConfig = {
      url,
      model: modelName,
      apiKey: apiKey || undefined,
      label: label || modelName,
    }
    await saveModelConfig(config)
    setCurrentConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    Alert.alert(
      'Remove fallback model',
      'WearIt will fall back to a degradation message when Claude credits run out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            await clearModelConfig()
            setCurrentConfig(null)
            setUrl('')
            setModelName('')
            setApiKey('')
            setLabel('')
            setTestStatus(null)
          }
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* ── Theme Picker ─────────────────────────────────── */}
      <Text style={styles.heading}>Appearance</Text>
      <Text style={styles.subheading}>
        Choose your WearIt aesthetic. More themes coming soon.
      </Text>

      <Text style={styles.sectionLabel}>Theme</Text>
      <View style={styles.presets}>
        {(Object.keys(THEMES) as ThemeKey[]).map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.presetBtn, themeKey === key && styles.presetBtnActive]}
            onPress={() => setThemeKey(key)}
          >
            <Text style={[styles.presetText, themeKey === key && styles.presetTextActive]}>
              {THEME_LABELS[key] ?? key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      {/* ── AI Model Settings ────────────────────────────── */}
      <Text style={styles.heading}>AI Model Settings</Text>
      <Text style={styles.subheading}>
        WearIt uses Claude for outfit suggestions. When your monthly credits run out,
        it falls back to any model you configure here — Ollama, Groq, OpenRouter, or anything
        that speaks the OpenAI API format.
      </Text>

      {/* Current status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current fallback</Text>
        <Text style={styles.statusValue}>
          {currentConfig ? `${currentConfig.label || currentConfig.model}` : 'None configured'}
        </Text>
        {currentConfig && (
          <Text style={styles.statusUrl} numberOfLines={1}>{currentConfig.url}</Text>
        )}
      </View>

      {/* Presets */}
      <Text style={styles.sectionLabel}>Quick presets</Text>
      <View style={styles.presets}>
        {PRESETS.map(preset => (
          <TouchableOpacity
            key={preset.label}
            style={styles.presetBtn}
            onPress={() => handlePreset(preset)}
          >
            <Text style={styles.presetText}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form */}
      <Text style={styles.sectionLabel}>Endpoint</Text>

      <Text style={styles.fieldLabel}>URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={t => { setUrl(t); setTestStatus(null); setSaved(false) }}
        placeholder="https://api.groq.com/openai/v1/chat/completions"
        placeholderTextColor={theme.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Text style={styles.fieldLabel}>Model name</Text>
      <TextInput
        style={styles.input}
        value={modelName}
        onChangeText={t => { setModelName(t); setTestStatus(null); setSaved(false) }}
        placeholder="llama3.2, mistral, gpt-4o-mini…"
        placeholderTextColor={theme.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.fieldLabel}>API key <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={t => { setApiKey(t); setSaved(false) }}
        placeholder="Leave blank for local models like Ollama"
        placeholderTextColor={theme.textPlaceholder}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.fieldLabel}>Display name <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. My Ollama, Groq Llama"
        placeholderTextColor={theme.textPlaceholder}
      />

      {/* Test */}
      <TouchableOpacity style={styles.testBtn} onPress={handleTest} disabled={testing}>
        {testing
          ? <ActivityIndicator color={theme.accent} />
          : <Text style={styles.testBtnText}>Test connection</Text>
        }
      </TouchableOpacity>

      {testStatus && (
        <View style={[styles.testResult, testStatus.ok ? styles.testOk : styles.testFail]}>
          <Text style={[styles.testResultText, testStatus.ok ? styles.testOkText : styles.testFailText]}>
            {testStatus.message}
          </Text>
        </View>
      )}

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? 'Saved ✓' : 'Save'}</Text>
      </TouchableOpacity>

      {currentConfig && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Remove fallback model</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: Spacing.screen,
    paddingTop: 48,
    paddingBottom: 48,
  },
  heading: {
    ...Typography.styles.screenTitle,
    color: theme.textPrimary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusLabel: {
    ...Typography.styles.sectionLabel,
    color: theme.sectionLabel,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  statusUrl: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    ...Typography.styles.sectionLabel,
    color: theme.sectionLabel,
    marginBottom: 10,
    marginTop: Spacing.xs,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  presetBtn: {
    backgroundColor: theme.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: theme.accentMuted,
  },
  presetBtnActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  presetText: {
    ...Typography.styles.bodySmall,
    color: theme.accent,
    fontWeight: '500',
  },
  presetTextActive: {
    color: theme.textOnAccent,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: Spacing.xl,
  },
  fieldLabel: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 6,
  },
  optional: {
    fontWeight: '400',
    color: theme.textSecondary,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: theme.border,
  },
  testBtn: {
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    marginBottom: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  testBtnText: {
    color: theme.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  testResult: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  testOk: {
    backgroundColor: 'rgba(86,163,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(86,163,92,0.3)',
  },
  testFail: {
    backgroundColor: theme.surfaceTint,
    borderWidth: 1,
    borderColor: theme.border,
  },
  testResultText: {
    fontSize: 13,
    fontWeight: '500',
  },
  testOkText: { color: '#3a7a3e' },
  testFailText: { color: theme.accentDanger },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveBtnText: {
    color: theme.textOnAccent,
    fontWeight: '700',
    fontSize: 16,
  },
  clearBtn: {
    padding: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
})
