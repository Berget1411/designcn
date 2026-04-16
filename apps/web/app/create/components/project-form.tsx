"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Copy01Icon, Globe02Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { useConfig } from "@/hooks/use-config"
import { copyToClipboardWithMeta } from "@/components/copy-button"
import { BASES, type BaseName } from "@/registry/config"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { decodeCustomThemeVars } from "@/app/create/lib/custom-theme-vars"
import {
  buildManualComponentsJson,
  buildManualGlobalsCss,
} from "@/app/create/lib/manual-install"
import {
  useDesignSystemSearchParams,
  type DesignSystemSearchParams,
} from "@/app/create/lib/search-params"
import {
  getFramework,
  getTemplateValue,
  NO_MONOREPO_FRAMEWORKS,
  TEMPLATES,
} from "@/app/create/lib/templates"

const TURBOREPO_LOGO =
  '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Turborepo</title><path d="M11.9906 4.1957c-4.2998 0-7.7981 3.501-7.7981 7.8043s3.4983 7.8043 7.7981 7.8043c4.2999 0 7.7982-3.501 7.7982-7.8043s-3.4983-7.8043-7.7982-7.8043m0 11.843c-2.229 0-4.0356-1.8079-4.0356-4.0387s1.8065-4.0387 4.0356-4.0387S16.0262 9.7692 16.0262 12s-1.8065 4.0388-4.0356 4.0388m.6534-13.1249V0C18.9726.3386 24 5.5822 24 12s-5.0274 11.66-11.356 12v-2.9139c4.7167-.3372 8.4516-4.2814 8.4516-9.0861s-3.735-8.749-8.4516-9.0861M5.113 17.9586c-1.2502-1.4446-2.0562-3.2845-2.2-5.3046H0c.151 2.8266 1.2808 5.3917 3.051 7.3668l2.0606-2.0622zM11.3372 24v-2.9139c-2.02-.1439-3.8584-.949-5.3019-2.2018l-2.0606 2.0623c1.975 1.773 4.538 2.9022 7.361 3.0534z"/></svg>'
const SHADCN_VERSION = process.env.NEXT_PUBLIC_RC ? "@rc" : "@latest"
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
type PackageManager = (typeof PACKAGE_MANAGERS)[number]
type InstallMode = "auto" | "manual"

function getAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export function ProjectForm({
  className,
}: React.ComponentProps<typeof Button>) {
  const [open, setOpen] = React.useState(false)
  const [installMode, setInstallMode] = React.useState<InstallMode>("auto")
  const [params, setParams] = useDesignSystemSearchParams()
  const searchParams = useSearchParams()
  const [config, setConfig] = useConfig()
  const [hasCopied, setHasCopied] = React.useState(false)

  const packageManager = (config.packageManager || "pnpm") as PackageManager
  const framework = React.useMemo(
    () => getFramework(params.template ?? "next"),
    [params.template]
  )
  const isMonorepo = React.useMemo(
    () => params.template?.endsWith("-monorepo") ?? false,
    [params.template]
  )

  const hasMonorepo = !NO_MONOREPO_FRAMEWORKS.includes(
    framework as (typeof NO_MONOREPO_FRAMEWORKS)[number]
  )
  const appOrigin = React.useMemo(() => getAppOrigin(), [])
  const customThemeVars = React.useMemo(
    () => decodeCustomThemeVars(params.vars),
    [params.vars]
  )
  const designSystemConfig = React.useMemo(
    () => ({
      base: params.base,
      style: params.style,
      iconLibrary: params.iconLibrary,
      baseColor: params.baseColor,
      theme: params.theme,
      chartColor: params.chartColor,
      font: params.font,
      fontHeading: params.fontHeading,
      item: params.item,
      rtl: params.rtl,
      menuAccent: params.menuAccent,
      menuColor: params.menuColor,
      radius: params.radius,
      template: params.template,
    }),
    [params]
  )

  const initUrl = React.useMemo(() => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.delete("item")
    nextSearchParams.delete("size")

    const query = nextSearchParams.toString()
    return query ? `${appOrigin}/api/init?${query}` : `${appOrigin}/api/init`
  }, [appOrigin, searchParams])

  const commands = React.useMemo(() => {
    const registryArg = ` '${initUrl}'`
    const baseFlag = params.base !== "radix" ? ` --base ${params.base}` : ""
    const templateFlag = ` --template ${framework}`
    const monorepoFlag = isMonorepo ? " --monorepo" : ""
    const rtlFlag = params.rtl ? " --rtl" : ""
    const flags = `${registryArg}${baseFlag}${templateFlag}${monorepoFlag}${rtlFlag}`

    return {
      pnpm: `pnpm dlx shadcn${SHADCN_VERSION} init${flags}`,
      npm: `npx shadcn${SHADCN_VERSION} init${flags}`,
      yarn: `yarn dlx shadcn${SHADCN_VERSION} init${flags}`,
      bun: `bunx --bun shadcn${SHADCN_VERSION} init${flags}`,
    }
  }, [framework, initUrl, isMonorepo, params.base, params.rtl])

  const manualCommands = React.useMemo(
    () => ({
      pnpm: `pnpm dlx shadcn${SHADCN_VERSION} add --all`,
      npm: `npx shadcn${SHADCN_VERSION} add --all`,
      yarn: `yarn dlx shadcn${SHADCN_VERSION} add --all`,
      bun: `bunx --bun shadcn${SHADCN_VERSION} add --all`,
    }),
    []
  )
  const componentsJson = React.useMemo(
    () => buildManualComponentsJson(designSystemConfig),
    [designSystemConfig]
  )
  const globalsCss = React.useMemo(
    () => buildManualGlobalsCss(designSystemConfig, customThemeVars),
    [customThemeVars, designSystemConfig]
  )
  const command = commands[packageManager]

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const handleCopy = React.useCallback(() => {
    const properties: Record<string, string> = {
      command,
    }
    if (params.template) {
      properties.template = params.template
    }
    copyToClipboardWithMeta(command, {
      name: "copy_npm_command",
      properties,
    })
    setHasCopied(true)
  }, [command, params.template])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn(className)}>Create Project</Button>
      </DialogTrigger>
      <DialogContent className="dark no-scrollbar max-h-[calc(100svh-2rem)] overflow-y-auto rounded-2xl p-6 shadow-xl **:data-[slot=field-separator]:h-2 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Pick a template and configure your project.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={installMode}
          onValueChange={(value) => setInstallMode(value as InstallMode)}
          className="gap-3"
        >
          <TabsList className="bg-muted/60">
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="auto" className="mt-0">
            <div className="flex w-full min-w-0 flex-col gap-3">
              <FieldGroup>
                <Field className="-mt-2 gap-3">
                  <FieldLabel>Template</FieldLabel>
                  <TemplateGrid
                    template={params.template}
                    setParams={setParams}
                  />
                </Field>
                <FieldSeparator className="-mx-6" />
                <Field className="-mt-2">
                  <FieldLabel>Base</FieldLabel>
                  <BaseGrid base={params.base} setParams={setParams} />
                </Field>
                <FieldSeparator className="-mx-6" />
                <FieldSet>
                  <FieldLegend variant="label" className="sr-only">
                    Options
                  </FieldLegend>
                  <Field
                    orientation="horizontal"
                    data-disabled={hasMonorepo ? undefined : "true"}
                  >
                    <FieldLabel htmlFor="monorepo">
                      <span
                        className="size-4 text-neutral-100 [&_svg]:size-4 [&_svg]:fill-current"
                        dangerouslySetInnerHTML={{
                          __html: TURBOREPO_LOGO,
                        }}
                      />
                      Create a monorepo
                    </FieldLabel>
                    <Switch
                      id="monorepo"
                      checked={params.template?.endsWith("-monorepo") ?? false}
                      disabled={!hasMonorepo}
                      onCheckedChange={(checked) => {
                        const framework = getFramework(
                          params.template ?? "next"
                        )
                        setParams({
                          template: getTemplateValue(
                            framework,
                            checked === true
                          ) as typeof params.template,
                        })
                      }}
                    />
                  </Field>
                  <FieldSeparator className="-mx-6" />
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="rtl">
                      <HugeiconsIcon icon={Globe02Icon} className="size-4" />
                      Enable RTL support
                    </FieldLabel>
                    <Switch
                      id="rtl"
                      checked={params.rtl}
                      onCheckedChange={(checked) =>
                        setParams({ rtl: checked === true })
                      }
                    />
                  </Field>
                </FieldSet>
              </FieldGroup>
              <PackageManagerCommandPanel
                packageManager={packageManager}
                setPackageManager={(value) => {
                  setConfig((prev) => ({
                    ...prev,
                    packageManager: value,
                  }))
                }}
                commands={commands}
                onCopy={handleCopy}
                hasCopied={hasCopied}
              />
            </div>
          </TabsContent>
          <TabsContent value="manual" className="mt-0">
            <div className="flex flex-col gap-3">
              <FieldGroup>
                <Field className="-mt-2">
                  <FieldLabel>Base</FieldLabel>
                  <BaseGrid base={params.base} setParams={setParams} />
                </Field>
              </FieldGroup>
              <PackageManagerCommandPanel
                packageManager={packageManager}
                setPackageManager={(value) => {
                  setConfig((prev) => ({
                    ...prev,
                    packageManager: value,
                  }))
                }}
                commands={manualCommands}
                title="Install all components"
                description="After copying the files below, run this command in your project."
                copyEventName="copy_manual_add_all_command"
              />
              <FieldGroup className="gap-3">
                <CodeField
                  label="components.json"
                  description="Copy this to your project root."
                  value={componentsJson}
                  copyEventName="copy_manual_components_json"
                />
                <CodeField
                  label="app/globals.css"
                  description="Replace your global stylesheet with this config."
                  value={globalsCss}
                  copyEventName="copy_manual_globals_css"
                />
              </FieldGroup>
              <p className="text-xs text-muted-foreground">
                Manual setup only covers the shadcn config files and component
                install. If you changed fonts, you still need to load those font
                families in your app.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function PackageManagerCommandPanel({
  packageManager,
  setPackageManager,
  commands,
  title = "Create project",
  description,
  onCopy,
  hasCopied,
  copyEventName = "copy_npm_command",
}: {
  packageManager: PackageManager
  setPackageManager: (value: PackageManager) => void
  commands: Record<PackageManager, string>
  title?: string
  description?: string
  onCopy?: () => void
  hasCopied?: boolean
  copyEventName?: string
}) {
  const [hasLocalCopy, setHasLocalCopy] = React.useState(false)
  const command = commands[packageManager]
  const copied = onCopy ? Boolean(hasCopied) : hasLocalCopy

  React.useEffect(() => {
    if (!hasLocalCopy) {
      return
    }

    const timer = setTimeout(() => setHasLocalCopy(false), 2000)
    return () => clearTimeout(timer)
  }, [hasLocalCopy])

  const handleCopy = React.useCallback(() => {
    if (onCopy) {
      onCopy()
      return
    }

    copyToClipboardWithMeta(command, {
      name: copyEventName,
      properties: {
        command,
      },
    })
    setHasLocalCopy(true)
  }, [command, copyEventName, onCopy])

  return (
    <div className="min-w-0 overflow-hidden rounded-xl ring-1 ring-border">
      <Tabs
        value={packageManager}
        onValueChange={(value) => setPackageManager(value as PackageManager)}
        className="min-w-0 gap-0"
      >
        <div className="flex items-center gap-2 border-b bg-popover/60 px-1 py-1">
          <TabsList className="bg-transparent font-mono">
            {PACKAGE_MANAGERS.map((manager) => (
              <TabsTrigger
                key={manager}
                value={manager}
                className="py-0 leading-none data-[state=active]:shadow-none"
              >
                {manager}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            size="icon-sm"
            variant="ghost"
            className="ml-auto"
            onClick={handleCopy}
          >
            {copied ? (
              <HugeiconsIcon icon={Tick02Icon} />
            ) : (
              <HugeiconsIcon icon={Copy01Icon} />
            )}
            <span className="sr-only">Copy command</span>
          </Button>
        </div>
        <div className="border-b bg-popover/40 px-3 py-2">
          <p className="text-xs font-medium">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {Object.entries(commands).map(([key, value]) => (
          <TabsContent key={key} value={key} className="mt-0">
            <div className="bg-popover p-3">
              <Textarea
                readOnly
                value={value}
                className="min-h-24 resize-y rounded-xl bg-background font-mono text-xs"
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <div className="border-t bg-popover/60 p-3">
        <Button onClick={handleCopy} className="h-9 w-full">
          {copied ? "Copied" : "Copy Command"}
        </Button>
      </div>
    </div>
  )
}

function CodeField({
  label,
  description,
  value,
  copyEventName,
}: {
  label: string
  description: string
  value: string
  copyEventName: string
}) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (!hasCopied) {
      return
    }

    const timer = setTimeout(() => setHasCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [hasCopied])

  const handleCopy = React.useCallback(() => {
    copyToClipboardWithMeta(value, {
      name: copyEventName,
      properties: {
        target: label,
      },
    })
    setHasCopied(true)
  }, [copyEventName, label, value])

  return (
    <Field className="gap-2 rounded-xl border border-border/70 bg-popover/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <FieldLabel>{label}</FieldLabel>
          <FieldDescription>{description}</FieldDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={handleCopy}
        >
          {hasCopied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Textarea
        readOnly
        value={value}
        className="min-h-40 resize-y rounded-xl bg-background font-mono text-xs"
      />
    </Field>
  )
}

const TemplateGrid = React.memo(function TemplateGrid({
  template,
  setParams,
}: {
  template: DesignSystemSearchParams["template"]
  setParams: ReturnType<typeof useDesignSystemSearchParams>[1]
}) {
  const isMonorepo = template?.endsWith("-monorepo") ?? false
  const framework = getFramework(template ?? "next")

  const handleTemplateChange = React.useCallback(
    (value: string) => {
      setParams({
        template: getTemplateValue(
          value,
          isMonorepo
        ) as DesignSystemSearchParams["template"],
      })
    },
    [isMonorepo, setParams]
  )

  return (
    <RadioGroup
      value={framework}
      onValueChange={handleTemplateChange}
      className="grid grid-cols-2 gap-2"
    >
      {TEMPLATES.map((item) => (
        <FieldLabel
          key={item.value}
          htmlFor={`template-${item.value}`}
          className="block w-full"
        >
          <Field
            orientation="horizontal"
            className="w-full rounded-md transition-colors duration-150 hover:bg-neutral-700/45"
          >
            <FieldContent className="flex flex-row items-center gap-2 px-2.5 py-1.5">
              <div
                className="size-4 text-neutral-100 [&_svg]:size-4 *:[svg]:text-neutral-100!"
                dangerouslySetInnerHTML={{
                  __html: item.logo,
                }}
              ></div>
              <FieldTitle>{item.title}</FieldTitle>
            </FieldContent>
            <RadioGroupItem
              value={item.value}
              id={`template-${item.value}`}
              className="sr-only absolute"
            />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
})

const BaseGrid = React.memo(function BaseGrid({
  base,
  setParams,
}: {
  base: DesignSystemSearchParams["base"]
  setParams: ReturnType<typeof useDesignSystemSearchParams>[1]
}) {
  const handleBaseChange = React.useCallback(
    (value: string) => {
      setParams({ base: value as BaseName })
    },
    [setParams]
  )

  return (
    <RadioGroup
      value={base}
      onValueChange={handleBaseChange}
      aria-label="Base"
      className="grid grid-cols-2 gap-2"
    >
      {BASES.map((item) => (
        <FieldLabel
          key={item.name}
          htmlFor={`base-${item.name}`}
          className="block w-full"
        >
          <Field
            orientation="horizontal"
            className="w-full rounded-md transition-colors duration-150 hover:bg-neutral-700/45"
          >
            <FieldContent className="flex flex-row items-center gap-2 px-2.5 py-1.5">
              <div
                className="size-4 text-neutral-100 [&_svg]:size-4 *:[svg]:text-neutral-100!"
                dangerouslySetInnerHTML={{
                  __html: item.meta?.logo ?? "",
                }}
              />
              <FieldTitle>{item.title}</FieldTitle>
            </FieldContent>
            <RadioGroupItem
              value={item.name}
              id={`base-${item.name}`}
              className="sr-only absolute"
            />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
})
