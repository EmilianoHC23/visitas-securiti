<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisitRequest extends FormRequest
{
    public function authorize()
    {
        // TODO: implement proper authorization (policies)
        return true;
    }

    public function rules()
    {
        return [
            'host_id' => 'required|exists:users,id',
            'access_id' => 'nullable|exists:accesses,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_email' => 'required|email|max:255',
            // Accept either scheduled_date or visit_date+visit_time pair
            'scheduled_date' => 'nullable|date',
            'visit_date' => 'nullable|date|required_without:scheduled_date',
            'visit_time' => 'nullable|string|required_with:visit_date|required_without:scheduled_date',
            // company_id may be deduced from host or authenticated user if missing
            'company_id' => 'nullable|exists:companies,id',
            'status' => 'nullable|in:pending,approved,rejected,completed',
        ];
    }
}
