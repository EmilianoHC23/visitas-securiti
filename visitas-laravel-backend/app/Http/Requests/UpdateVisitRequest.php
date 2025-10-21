<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVisitRequest extends FormRequest
{
    public function authorize()
    {
        $visit = $this->route('visit');
        if (! $visit) {
            return false;
        }
        $user = $this->user();
        if (! $user) {
            return false;
        }
        return $user->can('update', $visit);
    }

    public function rules()
    {
        return [
            'host_id' => 'sometimes|required|exists:users,id',
            'access_id' => 'sometimes|nullable|exists:accesses,id',
            'visitor_name' => 'sometimes|required|string|max:255',
            'visitor_email' => 'sometimes|required|email|max:255',
            'scheduled_date' => 'sometimes|required|date',
            'company_id' => 'sometimes|required|exists:companies,id',
            'status' => 'sometimes|in:pending,approved,rejected,completed',
        ];
    }
}
