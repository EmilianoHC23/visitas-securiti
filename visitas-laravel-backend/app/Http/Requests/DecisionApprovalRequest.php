<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DecisionApprovalRequest extends FormRequest
{
    public function authorize()
    {
        // token-based endpoint, allow for now
        return true;
    }

    public function rules()
    {
        return [
            'decision' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ];
    }
}
