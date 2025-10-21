<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Invitation;

class StoreInvitationRequest extends FormRequest
{
    public function authorize()
    {
        $user = $this->user();
        if (! $user) return false;
        return $user->can('create', Invitation::class);
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
