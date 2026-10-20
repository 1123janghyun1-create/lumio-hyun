import { NextResponse } from "next/server";
import {
  getSharedProjects,
  saveSharedProject,
  updateSharedProject,
  deleteSharedProject,
  recordSharedProjectView,
  recordSharedProjectOutboundClick,
  toggleSharedProjectLike,
} from "@/lib/serverStore";
import { getSupabase, projectToRow, rowToProject } from "@/lib/supabase/db";
import { Project } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewId = searchParams.get("view");
    if (viewId) {
      recordSharedProjectView(viewId);
    }

    // 1. Try Supabase first if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteProjects = data.map(rowToProject);
          // Resilient merge with local serverStore
          const local = getSharedProjects();
          const map = new Map<string, Project>();
          remoteProjects.forEach((p) => map.set(p.id, p));
          local.forEach((lp) => {
            if (!map.has(lp.id)) {
              map.set(lp.id, lp);
            }
          });
          return NextResponse.json(Array.from(map.values()));
        }
      } catch (dbErr) {
        console.warn("Supabase projects fetch error, fallback to store:", dbErr);
      }
    }

    // 2. Fallback to local serverStore
    const projects = getSharedProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const projectData = await req.json();
    if (!projectData || !projectData.title) {
      return NextResponse.json({ error: "Missing project title" }, { status: 400 });
    }

    const saved = saveSharedProject(projectData);

    // Sync to Supabase projects if table exists
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("projects").upsert(projectToRow(saved));
      }
    } catch (e) {
      console.warn("Supabase project insert error:", e);
    }

    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const updated = updateSharedProject(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Sync to Supabase if table exists
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("projects").upsert(projectToRow(updated));
      }
    } catch {}

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, action, userId } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    if (action === "outboundClick") {
      recordSharedProjectOutboundClick(id);
      return NextResponse.json({ success: true, id });
    }

    // Default action: toggle like
    const result = toggleSharedProjectLike(id, userId);

    // Sync like count to Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from("projects")
          .update({ likes_count: result.likesCount })
          .eq("id", id);
      }
    } catch {}

    return NextResponse.json({ success: true, id, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    deleteSharedProject(id);

    // Sync to Supabase if table exists
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("projects").delete().eq("id", id);
      }
    } catch {}

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
