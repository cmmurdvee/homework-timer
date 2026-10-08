import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { title, description } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert([{ title, description, status: 'idle' }])
            .select();

        if (error) {
            console.error('Supabase Create Task Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0], { status: 201 });
    } catch (err) {
        console.error('API Create Task Crash:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}