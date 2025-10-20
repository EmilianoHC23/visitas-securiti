<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvitationRequest extends FormRequest
{
    public function authorize()
    {
        // TODO: implement authorization logic (company admin)
        return true;
    }

    public function rules()
    {
        return [
            'email' => 'required|email',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:50',
            'company_id' => 'required|integer|exists:companies,id',
        ];
    }
}
