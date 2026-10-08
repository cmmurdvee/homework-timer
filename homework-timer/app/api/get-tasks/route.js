import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Get Tasks Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || [], { status: 200 });
    } catch (err) {
        console.error('API Get Tasks Crash:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}