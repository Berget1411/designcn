import { NextResponse, type NextRequest } from "next/server"
import { isPresetCode } from "shadcn/preset"
import { registryItemSchema } from "shadcn/schema"

import { buildRegistryBase } from "@/registry/config"
import { getPresetCode } from "@/app/create/lib/preset-code"
import { parseDesignSystemConfig } from "@/app/api/init/parse-config"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const result = parseDesignSystemConfig(searchParams)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const rawPreset = searchParams.get("preset")
    const presetCode =
      rawPreset && isPresetCode(rawPreset)
        ? rawPreset
        : getPresetCode(result.data)

    const registryBase = buildRegistryBase(result.data)
    const parseResult = registryItemSchema.safeParse(registryBase)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid registry base item",
          details: parseResult.error.format(),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(parseResult.data)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    )
  }
}
