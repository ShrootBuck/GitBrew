import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { env } from "../../../env";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function GET(request: NextRequest) {}
