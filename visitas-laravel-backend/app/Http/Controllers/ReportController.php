<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Visit;

class ReportController extends Controller
{
    // visits by date range: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    public function visitsByDate(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $query = Visit::query();
        if ($from) {
            $query->whereDate('scheduled_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('scheduled_date', '<=', $to);
        }

        $data = $query->selectRaw('DATE(scheduled_date) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    // visits by company: optional date range
    public function visitsByCompany(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $status = $request->query('status');

        $query = Visit::query();
        if ($from) {
            $query->whereDate('scheduled_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('scheduled_date', '<=', $to);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $data = $query->selectRaw('company_id, COUNT(*) as total')
            ->groupBy('company_id')
            ->orderBy('total', 'desc')
            ->get();

        // attach company name for each row (avoid N+1 by eager loading companies)
        $companyIds = $data->pluck('company_id')->filter()->unique()->values();
        $companies = [];
        if ($companyIds->isNotEmpty()) {
            $companies = \App\Models\Company::whereIn('id', $companyIds)->get()->keyBy('id')->map(function ($c) {
                return $c->name;
            })->toArray();
        }

        $result = $data->map(function ($row) use ($companies) {
            return [
                'company_id' => $row->company_id,
                'company_name' => $companies[$row->company_id] ?? null,
                'total' => (int) $row->total,
            ];
        })->values();

        return response()->json($result);
    }

    // visits by status
    public function visitsByStatus(Request $request)
    {
        $data = Visit::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get();

        return response()->json($data);
    }
}
