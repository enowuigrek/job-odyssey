import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('t');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  // Znajdź link po tokenie
  const { data: link, error } = await supabase
    .from('cv_tracking_links')
    .select('target_url')
    .eq('token', token)
    .single();

  if (error || !link) {
    return new Response('Link not found', { status: 404 });
  }

  // Zapisz klik
  await supabase.from('cv_clicks').insert({
    token,
    user_agent: req.headers.get('user-agent') ?? null,
    referrer: req.headers.get('referer') ?? null,
  });

  // Redirect do docelowego URL
  return new Response(null, {
    status: 302,
    headers: { Location: link.target_url },
  });
});
